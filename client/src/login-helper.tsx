import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginHelper() {
  const { user, loginMutation, isLoading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="bg-blue-500 text-white p-2 rounded-md"
      >
        {showDebug ? 'Hide' : 'Debug Login'}
      </button>
      
      {showDebug && (
        <div className="bg-white p-4 rounded-md shadow-md mt-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <div className="mb-2">
            <strong>Auth Status:</strong> {user ? 'Logged In' : 'Not Logged In'}
          </div>
          {user && (
            <div className="mb-2">
              <strong>User:</strong> {user.name} ({user.email}) 
              <br />
              <strong>Role:</strong> {user.role}
            </div>
          )}
          
          {!user && (
            <form onSubmit={handleLogin} className="space-y-2">
              <div>
                <label className="block text-sm">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border p-1 w-full text-black rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-1 w-full text-black rounded-md"
                />
              </div>
              <button 
                type="submit" 
                className="bg-green-500 text-white p-1 rounded-md w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
} 