import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeSubscription = (table, callback, filter = null) => {
  const subscriptionRef = useRef(null);
  const callbackRef = useRef(callback);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const retryTimeoutRef = useRef(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const setupSubscription = () => {
    console.log(`Setting up real-time subscription for table: ${table}`);
    
    // Clear any existing subscription
    if (subscriptionRef.current) {
      try {
        supabase.removeChannel(subscriptionRef.current);
      } catch (err) {
        console.error(`Error removing channel for ${table}:`, err);
      }
    }

    try {
      // Create subscription with unique channel name to avoid conflicts
      const channelName = `public:${table}:${Date.now()}`;
      const subscription = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
            presence: { key: 'user_id' },
            retryIntervalMs: 2000,
            retryTimeoutMs: 60000
          }
        })
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: table,
            ...(filter && { filter })
          }, 
          (payload) => {
            console.log(`REALTIME UPDATE received for ${table}:`, payload);
            if (callbackRef.current) {
              callbackRef.current(payload);
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`Real-time subscription status for ${table}:`, status);
          setConnectionStatus(status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${table}`);
            // Clear any retry timeout
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`Subscription error for ${table}:`, err);
            // Retry after 3 seconds with exponential backoff
            const retryDelay = retryTimeoutRef.current ? 5000 : 3000;
            console.log(`Will retry in ${retryDelay/1000} seconds...`);
            
            retryTimeoutRef.current = setTimeout(() => {
              console.log(`Retrying subscription for ${table}...`);
              setupSubscription();
            }, retryDelay);
          }
        });

      subscriptionRef.current = subscription;
    } catch (err) {
      console.error(`Failed to set up subscription for ${table}:`, err);
      // Set status to error so hybrid realtime can fall back to polling
      setConnectionStatus('CHANNEL_ERROR');
    }
  };

  useEffect(() => {
    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      console.log(`Cleaning up real-time subscription for ${table}`);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [table, filter]);

  return { subscription: subscriptionRef.current, status: connectionStatus };
};

// Specific hooks for different tables
export const useCasesRealtime = (callback) => {
  const { subscription, status } = useRealtimeSubscription('cases', callback);
  return { subscription, status };
};

export const useEvidenceRealtime = (callback) => {
  const { subscription, status } = useRealtimeSubscription('evidence_files', callback);
  return { subscription, status };
};

export const useMonitoringRealtime = (callback) => {
  const { subscription, status } = useRealtimeSubscription('monitoring_jobs', callback);
  return { subscription, status };
};

export const useMonitoringLogsRealtime = (callback) => {
  const { subscription, status } = useRealtimeSubscription('monitoring_logs', callback);
  return { subscription, status };
};