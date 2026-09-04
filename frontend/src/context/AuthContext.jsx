import { createContext, useContext, useEffect, useState } from 'react';

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

  async function register(name, email, password, role) {
  setLoading(true);

  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
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
    if (!user) {
      return;
    }

    async function verifySession() {
      try {
        const response = await api.get('/auth/me');

        if (response.data.user) {
          saveUser(response.data.user);
        }
      } catch {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    verifySession();
    // Runs once on mount to verify the persisted session is still valid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
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