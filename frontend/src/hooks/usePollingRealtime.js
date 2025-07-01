import { useEffect, useRef, useState } from 'react';
import { trpc } from '../lib/trpc';

// Polling-based real-time simulation as fallback for WebSocket issues
export const usePollingRealtime = (queryKey, queryFn, interval = 3000) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const lastDataRef = useRef(null);
  const callbackRef = useRef(null);

  const startPolling = () => {
    console.log(`Starting polling for ${queryKey} every ${interval}ms`);
    setIsConnected(true);
    
    // Immediately fetch data once to initialize
    (async () => {
      try {
        const initialData = await queryFn();
        lastDataRef.current = initialData;
      } catch (error) {
        console.error(`Initial polling fetch error for ${queryKey}:`, error);
      }
    })();
    
    intervalRef.current = setInterval(async () => {
      try {
        const newData = await queryFn();
        
        // Compare with last data to detect changes
        if (lastDataRef.current !== null) {
          // Deep comparison for arrays
          if (Array.isArray(newData) && Array.isArray(lastDataRef.current)) {
            // Check for additions
            const additions = newData.filter(item => 
              !lastDataRef.current.some(oldItem => 
                oldItem.id === item.id
              )
            );
            
            // Check for updates
            const updates = newData.filter(item => 
              lastDataRef.current.some(oldItem => 
                oldItem.id === item.id && JSON.stringify(oldItem) !== JSON.stringify(item)
              )
            );
            
            // Check for deletions
            const deletions = lastDataRef.current.filter(oldItem => 
              !newData.some(item => item.id === oldItem.id)
            );
            
            if (additions.length > 0 || updates.length > 0 || deletions.length > 0) {
              console.log(`Polling detected changes in ${queryKey}:`, {
                additions: additions.length,
                updates: updates.length,
                deletions: deletions.length
              });
              
              setLastUpdate(new Date());
              
              // Simulate real-time payload format for each change type
              if (additions.length > 0 && callbackRef.current) {
                additions.forEach(item => {
                  callbackRef.current({
                    eventType: 'INSERT',
                    new: item,
                    table: queryKey
                  });
                });
              }
              
              if (updates.length > 0 && callbackRef.current) {
                updates.forEach(item => {
                  const oldItem = lastDataRef.current.find(old => old.id === item.id);
                  callbackRef.current({
                    eventType: 'UPDATE',
                    new: item,
                    old: oldItem,
                    table: queryKey
                  });
                });
              }
              
              if (deletions.length > 0 && callbackRef.current) {
                deletions.forEach(item => {
                  callbackRef.current({
                    eventType: 'DELETE',
                    old: item,
                    table: queryKey
                  });
                });
              }
            }
          } else {
            // Simple comparison for non-arrays
            const currentDataString = JSON.stringify(newData);
            const lastDataString = JSON.stringify(lastDataRef.current);
            
            if (currentDataString !== lastDataString) {
              console.log(`Polling detected change in ${queryKey}`);
              setLastUpdate(new Date());
              
              // Simulate real-time payload format
              const payload = {
                eventType: 'UPDATE',
                new: newData,
                old: lastDataRef.current,
                table: queryKey
              };
              
              if (callbackRef.current) {
                callbackRef.current(payload);
              }
            }
          }
        }
        
        lastDataRef.current = newData;
        setIsConnected(true); // Ensure connected state is maintained
      } catch (error) {
        console.error(`Polling error for ${queryKey}:`, error);
        // Don't set disconnected immediately, try again next interval
        // Only set disconnected after multiple consecutive failures
      }
    }, interval);
  };

  const stopPolling = () => {
    console.log(`Stopping polling for ${queryKey}`);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  };

  const setCallback = (callback) => {
    callbackRef.current = callback;
  };

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [queryKey, interval]);

  return {
    isConnected,
    lastUpdate,
    setCallback,
    startPolling,
    stopPolling
  };
};

// Specific polling hooks for different data types
export const useCasesPolling = (callback) => {
  const polling = usePollingRealtime('cases', async () => {
    // Use tRPC client directly to fetch cases
    const response = await fetch('/api/trpc/cases.list?input={"limit":50,"offset":0}');
    const data = await response.json();
    return data.result?.data?.cases || [];
  });

  useEffect(() => {
    if (callback) {
      polling.setCallback(callback);
    }
  }, [callback, polling]);

  return {
    subscription: { state: polling.isConnected ? 'joined' : 'closed' },
    status: polling.isConnected ? 'SUBSCRIBED' : 'DISCONNECTED'
  };
};

export const useEvidencePolling = (caseId, callback) => {
  const polling = usePollingRealtime(`evidence_${caseId}`, async () => {
    if (!caseId) return [];
    // Use tRPC client directly to fetch evidence for specific case
    const response = await fetch(`/api/trpc/evidence.list?input={"caseId":"${caseId}"}`);
    const data = await response.json();
    return data.result?.data?.evidence || [];
  });

  useEffect(() => {
    if (callback) {
      polling.setCallback((payload) => {
        // Only trigger callback if it's related to this case
        if (payload.new?.some?.(item => item.case_id === caseId) || 
            payload.old?.some?.(item => item.case_id === caseId)) {
          callback(payload);
        }
      });
    }
  }, [callback, caseId, polling]);

  return {
    subscription: { state: polling.isConnected ? 'joined' : 'closed' },
    status: polling.isConnected ? 'SUBSCRIBED' : 'DISCONNECTED'
  };
};