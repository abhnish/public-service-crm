import React, { useState, useEffect } from 'react';
import { socketClient } from '../services/socketClient';
import { useToast } from '../components/ToastNotifications';

const SocketTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const { addToast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    // Test socket connection
    const testConnection = async () => {
      try {
        addLog('Attempting to connect to Socket.IO...');
        setConnectionStatus('Connecting...');
        
        // Get token from localStorage (if user is logged in)
        const storedToken = localStorage.getItem('authToken');
        
        if (!storedToken) {
          // Use a test token for demonstration (this would normally come from login)
          const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE2NzgxNjU4MjJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE2NzgxNjU4MjJ9.test';
          
          addLog('No auth token found, using test token for demonstration...');
          
          await socketClient.connect(testToken);
          setIsConnected(true);
          setConnectionStatus('Connected (Demo Mode)');
          addLog('✅ Socket.IO connected successfully in demo mode!');
          
          // Add success toast
          addToast({
            type: 'success',
            title: 'Socket.IO Connected (Demo)',
            message: 'Real-time features active in demo mode',
            duration: 3000
          });
        } else {
          // Use real token from localStorage
          addLog('Found auth token, connecting with real credentials...');
          
          await socketClient.connect(storedToken);
          setIsConnected(true);
          setConnectionStatus('Connected');
          addLog('✅ Socket.IO connected successfully with real token!');
          
          // Add success toast
          addToast({
            type: 'success',
            title: 'Socket.IO Connected',
            message: 'Real-time features are now active',
            duration: 3000
          });
        }
        
      } catch (error) {
        setIsConnected(false);
        setConnectionStatus('Connection Failed');
        addLog(`❌ Connection failed: ${error}`);
        
        // Add error toast
        addToast({
          type: 'error',
          title: 'Socket.IO Connection Failed',
          message: 'Real-time features may not work properly',
          duration: 5000
        });
      }
    };

    testConnection();

    // Cleanup
    return () => {
      socketClient.disconnect();
    };
  }, [addToast]);

  const handleDisconnect = () => {
    socketClient.disconnect();
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    addLog('🔌 Manually disconnected');
  };

  const handleReconnect = () => {
    // Get token from localStorage or use test token
    const storedToken = localStorage.getItem('authToken');
    const tokenToUse = storedToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE2NzgxNjU4MjJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE2NzgxNjU4MjJ9.test';
    
    socketClient.connect(tokenToUse)
      .then(() => {
        setIsConnected(true);
        setConnectionStatus(storedToken ? 'Connected' : 'Connected (Demo Mode)');
        addLog('🔄 Reconnected successfully');
      })
      .catch(error => {
        setIsConnected(false);
        setConnectionStatus('Connection Failed');
        addLog(`❌ Reconnection failed: ${error}`);
      });
  };

  const getStatusColor = () => {
    if (isConnected) return 'text-green-600 bg-green-50 border-green-200';
    if (connectionStatus === 'Connecting...') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = () => {
    if (isConnected) return '🟢';
    if (connectionStatus === 'Connecting...') return '🟡';
    return '🔴';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Socket.IO Connection Test</h1>
        
        {/* Connection Status */}
        <div className={`mb-6 p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getStatusIcon()}</span>
              <div>
                <h2 className="font-semibold">Connection Status</h2>
                <p className="text-sm opacity-75">{connectionStatus}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
              <button
                onClick={handleReconnect}
                disabled={isConnected}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reconnect
              </button>
            </div>
          </div>
        </div>

        {/* Connection Info */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Socket.IO Details</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Server:</strong> http://localhost:5001</li>
              <li><strong>Transport:</strong> WebSocket / Polling</li>
              <li><strong>Authentication:</strong> JWT Token</li>
              <li><strong>Status:</strong> {socketClient.getStatus().connected ? 'Connected' : 'Disconnected'}</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Real-time Features</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Complaint Created Events</li>
              <li>✅ Complaint Assigned Events</li>
              <li>✅ Status Update Events</li>
              <li>✅ Toast Notifications</li>
              <li>✅ Role-based Rooms</li>
            </ul>
          </div>
        </div>

        {/* Event Logs */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white mb-2">Connection Logs</h3>
          <div className="space-y-1">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Testing Instructions</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Ensure backend server is running on port 5001</li>
            <li>Click "Reconnect" to test Socket.IO connection</li>
            <li>Watch the connection status and logs</li>
            <li>Test real-time features by creating complaints in another tab</li>
            <li>Check for toast notifications when events occur</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SocketTest;
