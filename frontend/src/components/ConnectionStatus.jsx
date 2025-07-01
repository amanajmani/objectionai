import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Connection status indicator component
 * Shows the current connection status for real-time updates
 */
const ConnectionStatus = ({ status, method }) => {
  // Determine status color and icon
  const getStatusInfo = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          icon: <Wifi className="h-4 w-4 text-green-500" />,
          text: method === 'websocket' ? 'Real-time' : 'Polling',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          tooltip: method === 'websocket' 
            ? 'Connected via WebSocket real-time updates' 
            : 'Connected via polling updates'
        };
      case 'CONNECTING':
        return {
          icon: <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />,
          text: 'Connecting',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          tooltip: 'Establishing connection...'
        };
      case 'TIMED_OUT':
      case 'CHANNEL_ERROR':
      case 'CLOSED':
      case 'DISCONNECTED':
        return {
          icon: <WifiOff className="h-4 w-4 text-red-500" />,
          text: 'Offline',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          tooltip: 'Not connected to real-time updates'
        };
      default:
        return {
          icon: <WifiOff className="h-4 w-4 text-gray-500" />,
          text: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          tooltip: 'Connection status unknown'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
      className={`inline-flex items-center px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} text-xs font-medium`}
      title={statusInfo.tooltip}
    >
      {statusInfo.icon}
      <span className="ml-1">{statusInfo.text}</span>
    </div>
  );
};

export default ConnectionStatus;