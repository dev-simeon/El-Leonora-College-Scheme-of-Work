import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export type UserRole = 'teacher' | 'student';

interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (token: string, userData: User, isFirstLogin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  completeFirstLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      const firstLoginFlag = await SecureStore.getItemAsync('isFirstLogin');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Check for persistent first-login completion for this specific user
        const persistentFirstLoginFlag = await SecureStore.getItemAsync(`hasCompletedFirstLogin_${userData.id}`);
        if (persistentFirstLoginFlag === 'true') {
          setIsFirstLogin(false);
        } else {
          setIsFirstLogin(firstLoginFlag === 'true');
        }
      }
    } catch (e) {
      console.error('Failed to load auth data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData: User, firstLogin = false) => {
    try {
      // Check if this user has ALREADY completed first login in the past on this device
      const persistentFirstLoginFlag = await SecureStore.getItemAsync(`hasCompletedFirstLogin_${userData.id}`);
      const actualFirstLogin = persistentFirstLoginFlag === 'true' ? false : firstLogin;

      await SecureStore.setItemAsync('userToken', newToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      await SecureStore.setItemAsync('isFirstLogin', String(actualFirstLogin));

      setToken(newToken);
      setUser(userData);
      setIsFirstLogin(actualFirstLogin);
    } catch (e) {
      console.error('Failed to save auth data', e);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('isFirstLogin');

      setToken(null);
      setUser(null);
      setIsFirstLogin(false);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  const completeFirstLogin = async () => {
    if (user) {
      await SecureStore.setItemAsync(`hasCompletedFirstLogin_${user.id}`, 'true');
      await SecureStore.setItemAsync('isFirstLogin', 'false');
      setIsFirstLogin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isFirstLogin,
        login,
        logout,
        completeFirstLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
