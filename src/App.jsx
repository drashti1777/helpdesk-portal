import React, { useContext } from 'react';
import { Bell, Search, Sun, Moon, RefreshCw, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
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

import NotificationPanel from './components/Notifications/NotificationPanel';
import NotificationToast from './components/Notifications/NotificationToast';
import ConfirmModal from './components/Layout/ConfirmModal';
import PoweredByThemidnight from './components/Branding/PoweredByThemidnight';
import { useNavigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const getInitials = (name = '') =>
  name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

// ─── Top header bar ────────────────────────────────────────────────────────
const TopBar = ({ unreadCount, isDark, onToggleTheme }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef(null);

  React.useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const iconBtnStyle = {
    width: 40, height: 40, borderRadius: 'var(--radius)',
    background: 'transparent', border: '1px solid transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-muted)',
    transition: 'all 0.18s ease',
  };
  const onIconHoverIn = (e) => {
    e.currentTarget.style.background = 'var(--primary-soft)';
    e.currentTarget.style.color = 'var(--primary)';
  };
  const onIconHoverOut = (e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = 'var(--text-muted)';
  };

  return (
    <header style={{
      height: 68, minHeight: 68, borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.75rem', background: 'var(--bg-card)',
      position: 'sticky', top: 0, zIndex: 100, gap: '1.25rem',
    }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-muted)', borderRadius: 'var(--radius)',
        padding: '0.55rem 0.95rem', minWidth: 280, maxWidth: 380, flex: 1,
        border: '1px solid transparent', transition: 'all 0.18s',
      }}>
        <Search size={16} color="var(--text-subtle)" />
        <input
          type="text" placeholder="Search tickets, projects, users…"
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            color: 'var(--text-main)', fontSize: '0.85rem', padding: 0, margin: 0,
            boxShadow: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          onClick={onToggleTheme}
          style={iconBtnStyle}
          onMouseEnter={onIconHoverIn} onMouseLeave={onIconHoverOut}
          title="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => window.location.reload()}
          style={iconBtnStyle}
          onMouseEnter={onIconHoverIn} onMouseLeave={onIconHoverOut}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-notifications'))}
          style={{ ...iconBtnStyle, position: 'relative' }}
          onMouseEnter={onIconHoverIn} onMouseLeave={onIconHoverOut}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              background: 'var(--danger)', color: '#fff', fontSize: 10,
              fontWeight: 800, minWidth: 18, height: 18, padding: '0 4px',
              borderRadius: '999px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '2px solid var(--bg-card)',
              boxShadow: '0 2px 6px rgba(250,137,107,0.4)',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative', marginLeft: 6 }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.35rem 0.65rem 0.35rem 0.4rem',
              background: profileOpen ? 'var(--primary-soft)' : 'transparent',
              border: '1px solid transparent', borderRadius: 'var(--radius)',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.78rem',
            }}>
              {getInitials(user?.name)}
            </div>
            <div className="hide-mobile" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.1 }}>
                {user?.name?.split(' ')[0] || 'User'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'capitalize', marginTop: 2 }}>
                {user?.role?.replace('_', ' ') || 'member'}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-subtle)" style={{ transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              minWidth: 220, background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 1000,
              animation: 'fadeIn 0.18s ease-out',
            }}>
              <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>
              <div style={{ padding: 6 }}>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                  style={menuItemStyle}
                  onMouseEnter={menuItemHoverIn} onMouseLeave={menuItemHoverOut}
                >
                  <UserIcon size={15} /> My Profile
                </button>
                <button
                  onClick={() => { setProfileOpen(false); logout(); navigate('/login'); }}
                  style={{ ...menuItemStyle, color: 'var(--danger)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-soft)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const menuItemStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
  padding: '0.6rem 0.75rem', background: 'transparent', border: 'none',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left',
  color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 500,
  transition: 'background 0.15s',
};
const menuItemHoverIn  = (e) => { e.currentTarget.style.background = 'var(--bg-muted)'; };
const menuItemHoverOut = (e) => { e.currentTarget.style.background = 'transparent'; };

// ─── Layouts ───────────────────────────────────────────────────────────────
const useTheme = () => {
  const [isDark, setIsDark] = React.useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return false; // light by default
  });

  React.useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark } }));
  }, [isDark]);

  React.useEffect(() => {
    const handler = (e) => setIsDark(!!e.detail.isDark);
    window.addEventListener('theme-changed', handler);
    return () => window.removeEventListener('theme-changed', handler);
  }, []);

  return [isDark, () => setIsDark((d) => !d)];
};

const AppLayout = ({ children }) => {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isDark, toggleTheme] = useTheme();

  React.useEffect(() => {
    const handler = (e) => setUnreadCount(e.detail.count);
    window.addEventListener('unread-count-changed', handler);
    return () => window.removeEventListener('unread-count-changed', handler);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-page)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar unreadCount={unreadCount} isDark={isDark} onToggleTheme={toggleTheme} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>{children}</div>
          <footer style={{
            padding: '1rem 2rem', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-card)',
            flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <span>&copy; {new Date().getFullYear()} Helpdesk Portal. All rights reserved.</span>
            <PoweredByThemidnight size="sm" />
          </footer>
        </div>
      </div>
      <NotificationPanel />
      <ConfirmModal />
      <div style={{ position: 'fixed', top: 84, right: '1.5rem', zIndex: 10001 }}>
        <NotificationToast />
      </div>
    </div>
  );
};

const AppLayoutClean = ({ children }) => {
  useTheme(); // apply theme class
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-page)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>{children}</div>
      <ConfirmModal />
      <div style={{ position: 'fixed', top: 24, right: '1.5rem', zIndex: 10001 }}>
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
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>
        } />

        <Route path="/tickets" element={
          <PrivateRoute><AppLayout><Tickets /></AppLayout></PrivateRoute>
        } />

        <Route path="/tickets/new" element={
          <PrivateRoute><AppLayoutClean><NewTicket /></AppLayoutClean></PrivateRoute>
        } />

        <Route path="/tickets/:id" element={
          <PrivateRoute><AppLayout><TicketDetail /></AppLayout></PrivateRoute>
        } />

        <Route path="/knowledge-base" element={
          <PrivateRoute><AppLayout><Help /></AppLayout></PrivateRoute>
        } />



        <Route path="/users" element={
          <RoleRoute allowedRoles={['admin', 'team_leader']}>
            <AppLayout><Users /></AppLayout>
          </RoleRoute>
        } />

        <Route path="/admin" element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><AdminControl /></AppLayout>
          </RoleRoute>
        } />

        <Route path="/projects" element={
          <PrivateRoute><AppLayout><Projects /></AppLayout></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
