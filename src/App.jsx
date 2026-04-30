import React, { useContext } from 'react';
import { Bell } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import Users from './pages/Users';
import AdminControl from './pages/AdminControl';
import Help from './pages/KnowledgeBase';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import NotificationPanel from './components/Notifications/NotificationPanel';
import NotificationToast from './components/Notifications/NotificationToast';
import { RefreshCw, Sun, Moon } from 'lucide-react';

// Redirect unauthenticated users to login
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

// Restrict routes by role
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

import ConfirmModal from './components/Layout/ConfirmModal';

const AppLayout = ({ children }) => {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLight, setIsLight] = React.useState(() => {
    return localStorage.getItem('theme') === 'light' || document.body.classList.contains('light-theme');
  });

  React.useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  const toggleTheme = () => setIsLight(!isLight);

  React.useEffect(() => {
    const handleCountChange = (e) => setUnreadCount(e.detail.count);
    window.addEventListener('unread-count-changed', handleCountChange);
    return () => window.removeEventListener('unread-count-changed', handleCountChange);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar */}
        <header style={{
          height: '64px', minHeight: '64px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 2rem', background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          position: 'sticky', top: 0, zIndex: 1000, gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <button 
              onClick={toggleTheme}
              style={{
                background: 'var(--glass)', border: '1px solid var(--border)',
                width: '40px', height: '40px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-main)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--glass)'; }}
              title="Toggle Theme"
            >
              {isLight ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
              style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-notifications'))}
              style={{
                background: 'var(--glass)', border: '1px solid var(--border)',
                width: '44px', height: '44px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-main)', transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--glass)'; }}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: '#ef4444', color: 'white', fontSize: '11px',
                  fontWeight: '800', minWidth: '22px', height: '22px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '3px solid var(--bg-dark)',
                  boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          {/* Footer */}
          <footer style={{
            padding: '1.5rem 3rem', borderTop: '1px solid var(--border)',
            textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem',
            background: 'var(--glass)', flexShrink: 0
          }}>
            &copy; {new Date().getFullYear()} Helpdesk Portal. All rights reserved.
          </footer>
        </div>
      </div>
      <NotificationPanel />
      <ConfirmModal />
      <div style={{ position: 'fixed', top: '80px', right: '2rem', zIndex: 10001 }}>
        <NotificationToast />
      </div>
    </div>
  );
};

// Clean layout — sidebar only, no top header bar, no footer
const AppLayoutClean = ({ children }) => {
  const [isLight, setIsLight] = React.useState(() => {
    return localStorage.getItem('theme') === 'light' || document.body.classList.contains('light-theme');
  });

  React.useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      <ConfirmModal />
      <div style={{ position: 'fixed', top: '24px', right: '2rem', zIndex: 10001 }}>
        <NotificationToast />
      </div>
    </div>
  );
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/projects" replace />} />

        {/* Dashboard — ALL roles including client */}
        <Route path="/" element={<Navigate to="/projects" replace />} />

        {/* Tickets — everyone */}
        <Route path="/profile" element={
          <PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>
        } />

        <Route path="/tickets" element={
          <PrivateRoute>
            <AppLayout><Tickets /></AppLayout>
          </PrivateRoute>
        } />

        {/* New Ticket — everyone (clean layout, no header/footer) */}
        <Route path="/tickets/new" element={
          <PrivateRoute>
            <AppLayoutClean><NewTicket /></AppLayoutClean>
          </PrivateRoute>
        } />

        {/* Ticket Detail — everyone */}
        <Route path="/tickets/:id" element={
          <PrivateRoute>
            <AppLayout><TicketDetail /></AppLayout>
          </PrivateRoute>
        } />

        {/* Help — everyone */}
        <Route path="/knowledge-base" element={
          <PrivateRoute>
            <AppLayout><Help /></AppLayout>
          </PrivateRoute>
        } />

        {/* Leaderboard — everyone */}
        <Route path="/leaderboard" element={
          <PrivateRoute>
            <AppLayout><Leaderboard /></AppLayout>
          </PrivateRoute>
        } />

        {/* User Management — admin, team_leader */}
        <Route path="/users" element={
          <RoleRoute allowedRoles={['admin', 'team_leader']}>
            <AppLayout><Users /></AppLayout>
          </RoleRoute>
        } />

        {/* Admin Control */}
        <Route path="/admin" element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><AdminControl /></AppLayout>
          </RoleRoute>
        } />

        {/* Projects */}
        <Route path="/projects" element={
          <PrivateRoute>
            <AppLayout><Projects /></AppLayout>
          </PrivateRoute>
        } />



        {/* Fallback */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;