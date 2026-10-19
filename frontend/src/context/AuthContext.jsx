import { createContext, useContext, useEffect, useRef, useState } from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'aurevia_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const initialUserRef = useRef(user);

  function saveUser(userData) {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }

  async function login(email, password) {
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      saveUser(response.data.user);

      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Unable to login. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password, role, therapistCode) {
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        therapist_code: therapistCode,
      });

      saveUser(response.data.user);

      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Unable to register. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // The local authentication state should still be cleared.
    }

    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    let isActive = true;

    async function verifySession() {
      if (!initialUserRef.current) {
        setIsReady(true);
        return;
      }

      try {
        const response = await api.get('/auth/me');

        if (isActive && response.data.user) {
          saveUser(response.data.user);
        } else if (isActive) {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        if (isActive) {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (isActive) setIsReady(true);
      }
    }

    verifySession();
    // Runs once on mount to verify the persisted session is still valid.
    return () => { isActive = false; };
  }, []);

  const value = {
    user,
    loading,
    isReady,
    isAuthenticated: isReady && Boolean(user),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}
