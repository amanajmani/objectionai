import { useState, useEffect, useRef } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useCasesPolling, useEvidencePolling } from './usePollingRealtime';

// Hybrid approach: Try WebSocket first, fallback to polling
export const useHybridRealtime = (type, callback, options = {}) => {
  const [connectionMethod, setConnectionMethod] = useState('websocket');
  const [finalStatus, setFinalStatus] = useState('CONNECTING');
  const fallbackTimeoutRef = useRef(null);
  const { caseId } = options;

  // Try WebSocket first
  const websocketResult = type === 'cases' 
    ? useRealtimeSubscription('cases', callback)
    : useRealtimeSubscription('evidence_files', callback);

  // Fallback polling
  const pollingResult = type === 'cases'
    ? useCasesPolling(callback)
    : useEvidencePolling(caseId, callback);

  useEffect(() => {
    // Monitor WebSocket connection
    if (websocketResult.status === 'SUBSCRIBED') {
      console.log(`WebSocket connection successful for ${type}`);
      setConnectionMethod('websocket');
      setFinalStatus('SUBSCRIBED');
      
      // Clear fallback timeout
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    } else if (
      websocketResult.status === 'TIMED_OUT' || 
      websocketResult.status === 'CHANNEL_ERROR' || 
      websocketResult.status === 'CLOSED'
    ) {
      console.log(`WebSocket failed for ${type}, falling back to polling...`);
      
      // Set timeout to switch to polling after WebSocket fails
      if (!fallbackTimeoutRef.current) {
        fallbackTimeoutRef.current = setTimeout(() => {
          setConnectionMethod('polling');
          setFinalStatus(pollingResult.status);
        }, 1000);
      }
    } else if (websocketResult.status === 'CONNECTING') {
      setFinalStatus('CONNECTING');
      
      // Set a timeout to fall back to polling if connection takes too long
      if (!fallbackTimeoutRef.current) {
        fallbackTimeoutRef.current = setTimeout(() => {
          if (websocketResult.status !== 'SUBSCRIBED') {
            console.log(`WebSocket connection taking too long for ${type}, falling back to polling...`);
            setConnectionMethod('polling');
            setFinalStatus(pollingResult.status);
          }
        }, 5000);
      }
    }

    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };
  }, [websocketResult.status, pollingResult.status, type]);

  // Update final status based on active connection method
  useEffect(() => {
    if (connectionMethod === 'polling') {
      setFinalStatus(pollingResult.status);
    }
  }, [connectionMethod, pollingResult.status]);

  const activeResult = connectionMethod === 'websocket' ? websocketResult : pollingResult;

  return {
    subscription: activeResult.subscription,
    status: finalStatus,
    connectionMethod,
    isWebSocket: connectionMethod === 'websocket',
    isPolling: connectionMethod === 'polling'
  };
};

// Specific hooks
export const useCasesHybridRealtime = (callback) => {
  return useHybridRealtime('cases', callback);
};

export const useEvidenceHybridRealtime = (callback, caseId) => {
  return useHybridRealtime('evidence', callback, { caseId });
};