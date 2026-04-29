import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const normalizeRole = (role = '') => {
  const key = String(role).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const roleMap = {
    superadmin: 'admin',
    super_admin: 'admin',
    teamleader: 'team_leader',
    team_leader: 'team_leader',
    admin: 'admin',
    employee: 'employee',
    hr: 'hr',
  };
  return roleMap[key] || 'employee';
};

const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    role: normalizeRole(userData.role),
    points: typeof userData.points === 'number' ? userData.points : 0,
    currentBadge: userData.currentBadge || 'none',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = normalizeUser(JSON.parse(storedUser));
      localStorage.setItem('user', JSON.stringify(parsed));
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    localStorage.setItem('user', JSON.stringify(normalized));
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
