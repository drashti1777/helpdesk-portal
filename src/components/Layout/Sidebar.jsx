import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard, Ticket, Users, ShieldCheck, BookOpen, Trophy,
  Briefcase, Rocket,
} from 'lucide-react';
import PoweredByThemidnight from '../Branding/PoweredByThemidnight';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.7rem',
        padding: '0.5rem 0.75rem 1.25rem', marginBottom: '0.5rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', boxShadow: '0 6px 16px rgba(93,135,255,0.3)',
        }}>
          <Rocket size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Helpdesk
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
            Support Portal
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
        <div className="nav-section-label">Workspace</div>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Briefcase size={18} /> Projects
        </NavLink>

        <NavLink to="/tickets" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Ticket size={18} /> {role === 'employee' ? 'My Tickets' : 'Tickets'}
        </NavLink>

        <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={18} /> Leaderboard
        </NavLink>

        <NavLink to="/knowledge-base" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BookOpen size={18} /> Knowledge Base
        </NavLink>

        {(role === 'admin' || role === 'team_leader') && (
          <>
            <div className="nav-section-label">Management</div>
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} /> Manage Team
            </NavLink>
            {role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <ShieldCheck size={18} /> Admin Control
              </NavLink>
            )}
          </>
        )}
      </nav>

      {/* Footer branding only - profile/logout lives in topbar */}
      <div style={{
        paddingTop: '1rem', marginTop: '0.5rem',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <PoweredByThemidnight size="sm" />
      </div>
    </aside>
  );
};

export default Sidebar;
