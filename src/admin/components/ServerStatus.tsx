import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface ServerStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkServerStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      
      const isServerOnline = response.ok;
      setIsOnline(isServerOnline);
      setLastCheck(new Date());
      
      if (onStatusChange) {
        onStatusChange(isServerOnline);
      }
    } catch (error) {
      setIsOnline(false);
      setLastCheck(new Date());
      
      if (onStatusChange) {
        onStatusChange(false);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkServerStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
      isOnline 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isChecking ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isOnline ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      
      <span className="font-medium">
        {isOnline ? 'Server Online' : 'Server Offline'}
      </span>
      
      <span className="text-xs opacity-75">
        {lastCheck.toLocaleTimeString()}
      </span>
    </div>
  );
};

export default ServerStatus;