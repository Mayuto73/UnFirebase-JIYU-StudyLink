import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setProfileRole: (role: 'student' | 'teacher' | 'manager', subjects?: string[], name?: string) => Promise<void>;
  logout: () => void;
  login: (token: string, userData: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  setProfileRole: async () => {},
  logout: () => {},
  login: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser({ uid: userData.uid, email: userData.email, displayName: userData.displayName });
          if (userData.role) {
            setProfile(userData);
          }
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    setUser({ uid: userData.uid, email: userData.email, displayName: userData.displayName });
    if (userData.role) {
      setProfile(userData);
    } else {
      setProfile(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const setProfileRole = async (role: 'student' | 'teacher' | 'manager', subjects?: string[], name?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role, subjects, name })
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        if (name) {
          setUser(prev => prev ? { ...prev, displayName: name } : null);
        }
      }
    } catch (error) {
      console.error('Failed to update profile role', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfileRole, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
};
