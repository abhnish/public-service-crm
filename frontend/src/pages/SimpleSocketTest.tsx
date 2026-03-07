import React, { useState } from 'react';
import { useToast } from '../components/ToastNotifications';

const SimpleSocketTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const { addToast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const testBasicConnection = async () => {
    try {
      addLog('Testing basic Socket.IO connection...');
      
      // Test basic socket connection without authentication
      const socket = new (window as any).io('http://localhost:5001', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      socket.on('connect', () => {
        addLog('✅ Basic Socket.IO connection successful!');
        addToast({
          type: 'success',
          title: 'Socket.IO Connected',
          message: 'Basic connection working',
          duration: 3000
        });
      });

      socket.on('connect_error', (error: any) => {
        addLog(`❌ Connection error: ${error.message}`);
        addToast({
          type: 'error',
          title: 'Connection Failed',
          message: error.message,
          duration: 5000
        });
      });

      socket.on('disconnect', () => {
        addLog('🔌 Disconnected');
      });

      // Test connection
      socket.connect();

      // Cleanup after 10 seconds
      setTimeout(() => {
        socket.disconnect();
        addLog('🔌 Test completed, socket disconnected');
      }, 10000);

    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
      addToast({
        type: 'error',
        title: 'Test Failed',
        message: 'Could not create socket connection',
        duration: 5000
      });
    }
  };

  const testBackendAPI = async () => {
    try {
      addLog('Testing backend API...');
      const response = await fetch('http://localhost:5001/api/health');
      
      if (response.ok) {
        const data = await response.json();
        addLog('✅ Backend API working!');
        addLog(`Response: ${JSON.stringify(data)}`);
        addToast({
          type: 'success',
          title: 'API Working',
          message: 'Backend API is responding',
          duration: 3000
        });
      } else {
        addLog(`❌ API error: ${response.status}`);
        addToast({
          type: 'error',
          title: 'API Error',
          message: `Status: ${response.status}`,
          duration: 5000
        });
      }
    } catch (error) {
      addLog(`❌ API test failed: ${error}`);
      addToast({
        type: 'error',
        title: 'API Test Failed',
        message: 'Could not reach backend',
        duration: 5000
      });
    }
  };

  const testSocketEndpoint = async () => {
    try {
      addLog('Testing Socket.IO endpoint...');
      const response = await fetch('http://localhost:5001/socket.io/?EIO=4&transport=polling');
      
      if (response.ok) {
        const text = await response.text();
        addLog('✅ Socket.IO endpoint working!');
        addLog(`Response: ${text.substring(0, 50)}...`);
        addToast({
          type: 'success',
          title: 'Socket.IO Endpoint Working',
          message: 'Server is accepting connections',
          duration: 3000
        });
      } else {
        addLog(`❌ Socket.IO endpoint error: ${response.status}`);
        addToast({
          type: 'error',
          title: 'Socket.IO Error',
          message: `Status: ${response.status}`,
          duration: 5000
        });
      }
    } catch (error) {
      addLog(`❌ Socket.IO test failed: ${error}`);
      addToast({
        type: 'error',
        title: 'Socket.IO Test Failed',
        message: 'Could not reach Socket.IO endpoint',
        duration: 5000
      });
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Simple Socket.IO Test</h1>
        
        {/* Test Buttons */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={testBackendAPI}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Backend API
          </button>
          <button
            onClick={testSocketEndpoint}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Socket.IO Endpoint
          </button>
          <button
            onClick={testBasicConnection}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Socket Connection
          </button>
        </div>

        <button
          onClick={clearLogs}
          className="mb-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>

        {/* Connection Info */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test Configuration</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Backend URL:</strong> http://localhost:5001</li>
            <li><strong>Socket.IO URL:</strong> http://localhost:5001</li>
            <li><strong>Authentication:</strong> None (basic test)</li>
            <li><strong>Transports:</strong> WebSocket, Polling</li>
          </ul>
        </div>

        {/* Event Logs */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white mb-2">Test Logs</h3>
          <div className="space-y-1">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet. Click test buttons to start...</div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Test Instructions</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click "Test Backend API" to verify server is running</li>
            <li>Click "Test Socket.IO Endpoint" to verify Socket.IO is accessible</li>
            <li>Click "Test Socket Connection" to test actual socket connection</li>
            <li>Watch logs and toast notifications for results</li>
            <li>If all tests pass, the Socket.IO setup is working correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SimpleSocketTest;
