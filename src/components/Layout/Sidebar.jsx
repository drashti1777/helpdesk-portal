import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard, Ticket, Users, LogOut,
  PlusCircle, ShieldCheck, Headphones, Bell, Award, BookOpen,
  Sun, Moon, Trophy
} from 'lucide-react';
import Badge from '../Badge';

const ROLE_META = {
  admin: { label: 'Admin', color: '#a5b4fc', bg: 'rgba(99,102,241,0.15)' },
  team_leader: { label: 'Team Leader', color: '#c084fc', bg: 'rgba(168,85,247,0.15)' },
  employee: { label: 'Employee', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
  hr: { label: 'HR', color: '#fb7185', bg: 'rgba(251,113,133,0.15)' },
};

const getInitials = (name = '') =>
  name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const role = user?.role;
  const meta = ROLE_META[role] || ROLE_META.employee;

  // Theme state moved to AppLayout

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <div style={{ marginBottom: '2rem', padding: '0 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Headphones size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700', lineHeight: 1 }}>HelpDesk</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>Ticketing Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */ }
  <nav style={{ flex: 1 }}>

    {/* Dashboard — all roles */}
    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <LayoutDashboard size={18} /> Dashboard
    </NavLink>

    {/* Tickets — everyone */}
    <NavLink to="/tickets" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <Ticket size={18} />
      {role === 'employee' ? 'All Tickets' : 'Tickets'}
    </NavLink>

    {/* Project */}
    {role === 'admin' && (
      <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <PlusCircle size={18} /> Project
      </NavLink>
    )}

    {/* Users — admin, team_leader */}
    {(role === 'admin' || role === 'team_leader') && (
      <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <Users size={18} /> Manage Team
      </NavLink>
    )}

    {/* Admin Control */}
    {role === 'admin' && (
      <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <ShieldCheck size={18} /> Admin Control
      </NavLink>
    )}

    {/* Help — everyone */}
    <NavLink to="/knowledge-base" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <BookOpen size={18} /> Help
    </NavLink>
  </nav>

  {/* User Card */ }
  <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
    <div
      onClick={() => navigate('/profile')}
      style={{
        padding: '0.85rem 1rem',
        background: 'var(--glass)',
        borderRadius: 'var(--radius)',
        marginBottom: '0.75rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        border: '1px solid transparent'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: '0.8rem', color: '#fff', flexShrink: 0
      }}>
        {getInitials(user?.name)}
      </div>
      <div style={{ overflow: 'hidden' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user?.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '0.15rem 0.55rem', borderRadius: '999px',
            background: meta.bg, color: meta.color, display: 'inline-block'
          }}>
            {meta.label}
          </span>
          {['employee', 'team_leader', 'hr'].includes(role) && user?.currentBadge && user.currentBadge !== 'none' && (
            <Badge tier={user.currentBadge} size="sm" showLabel={false} />
          )}
        </div>
      </div>
    </div>
    <button
      onClick={handleLogout}
      className="btn btn-outline"
      style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem', padding: '0.6rem 1rem' }}
    >
      <LogOut size={16} /> Sign Out
    </button>
  </div>
    </div >
  );
};

export default Sidebar;
