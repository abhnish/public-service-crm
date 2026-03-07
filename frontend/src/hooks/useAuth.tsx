import React, { useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { User } from '../services/api';
import { socketClient } from '../services/socketClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'citizen' | 'officer' | 'admin';
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  location: { state?: { from?: { pathname?: string } } };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, navigate, location }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Connect to Socket.IO when token is available
      socketClient.connect(storedToken).catch(error => {
        console.error('Socket connection failed:', error);
      });
    }
    setIsLoading(false);

    // Cleanup on unmount
    return () => {
      socketClient.disconnect();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Connect to Socket.IO after login
      socketClient.connect(newToken).catch(error => {
        console.error('Socket connection failed:', error);
      });
      
      // Redirect to the page they were trying to access, or default to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'citizen' | 'officer' | 'admin';
  }) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Connect to Socket.IO after registration
      socketClient.connect(newToken).catch(error => {
        console.error('Socket connection failed:', error);
      });
      
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Disconnect from Socket.IO
    socketClient.disconnect();
    
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
