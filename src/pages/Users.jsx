import API_BASE_URL from '../config';
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  User, Shield, Trash2, Search, UserCheck, Users as UsersIcon,
  RefreshCw, ChevronDown, Globe, ShieldCheck, PlusCircle, X, Award, Clock, Trophy
} from 'lucide-react';
import ConfirmModal from '../components/Layout/ConfirmModal';
import Badge from '../components/Badge';
import AddUserDrawer from '../components/Users/AddUserDrawer';

const ROLE_META = {
  admin: { label: 'Admin', color: '#a5b4fc', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', icon: Shield },
  team_leader: { label: 'Team Leader', color: '#c084fc', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', icon: Award },
  hr: { label: 'HR Role', color: '#fb7185', bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.3)', icon: ShieldCheck },
  employee: { label: 'Employee', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', icon: UserCheck },
};

const avatarGradients = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  'linear-gradient(135deg,#10b981,#0ea5e9)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#14b8a6,#6366f1)',
];
const getGradient = (id = '') => avatarGradients[id.charCodeAt(0) % avatarGradients.length];
const getInitials = (name = '') => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
const formatDateTimeParts = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { datePart, timePart };
};

const Users = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);

  // Add User Drawer State
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, emp: null });

  const isAdmin = user.role === 'admin';
  const isTeamLeader = user.role === 'team_leader';

  const fetchUrl = `${API_BASE_URL}/api/users/employees`;

  const fetchUsers = () => {
    setLoading(true);
    fetch(fetchUrl, { headers: { 'Authorization': `Bearer ${user.token}` } })
      .then(res => res.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [user.token]);

  useEffect(() => {
    const handler = () => setActionMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const showToast = (msg, type = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { type, message: msg } 
    }));
  };

  const handleRoleChange = async (emp, newRole) => {
    setActionMenu(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${emp._id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === emp._id ? { ...u, role: newRole } : u));
        showToast(`${emp.name}'s role updated to ${newRole.replace('_', ' ')}`);
      } else {
        const d = await res.json();
        showToast(d.message || 'Failed to update role', 'error');
      }
    } catch { showToast('Server error', 'error'); }
  };

  const handleDelete = async () => {
    const { emp } = deleteConfirm;
    if (!emp) return;
    setDeleteConfirm({ isOpen: false, emp: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${emp._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== emp._id));
        showToast(`${emp.name} removed successfully`);
      } else {
        const d = await res.json();
        showToast(d.message || 'Failed to delete user', 'error');
      }
    } catch { showToast('Server error', 'error'); }
  };

  const onUserAdded = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
    showToast(`${newUser.name} added successfully as ${newUser.role}`);
  };

  const filtered = users.filter(u => {
    // If TL, hide Admins entirely
    if (isTeamLeader && u.role === 'admin') return false;

    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // Stats per role
  const roleCounts = Object.keys(ROLE_META)
    .filter(r => !isTeamLeader || r !== 'admin')
    .reduce((acc, r) => {
      acc[r] = users.filter(u => u.role === r).length;
      return acc;
    }, {});

  const getAssignableRolesForUser = (targetUser) => {
    if (isAdmin) return ['admin', 'team_leader', 'hr', 'employee'];
    if (isTeamLeader && (targetUser.role === 'employee' || targetUser.role === 'team_leader')) {
      return ['team_leader', 'employee']; // TL can only toggle between TL and Employee
    }
    return [];
  };

  const canManage = (targetUser) => {
    if (targetUser._id === user._id) return false; // Cannot manage self via menu
    if (targetUser.role === 'admin') return false; // Admins are untouchable
    if (isAdmin) return true;
    if (isTeamLeader) {
      // TL can only manage Employees
      return targetUser.role === 'employee';
    }
    return false;
  };

  return (
    <div className="main-content animate-fade-in" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Global notifications used instead of local toast */}

      {/* Header */}
      <header style={{
        marginBottom: '2rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            Team Management
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Manage your team — admins, team leaders, and employees.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={fetchUsers} style={{ fontSize: '0.875rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddDrawer(true)} style={{ fontSize: '0.875rem' }}>
            <PlusCircle size={15} /> Add User
          </button>
        </div>
      </header>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {['admin', 'team_leader', 'employee'].filter(r => !isTeamLeader || r === 'employee').map(role => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <div key={role} className="glass-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={meta.color} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.1rem' }}>{meta.label}s</p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>{roleCounts[role] ?? 0}</h2>
              </div>
            </div>
          );
        })}
        <div className="glass-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UsersIcon size={18} color="#a5b4fc" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.1rem' }}>Total Users</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>{users.length}</h2>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem', marginBottom: 0, fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ width: 'auto', minWidth: '160px', marginBottom: 0, fontSize: '0.875rem', cursor: 'pointer', appearance: 'none', paddingRight: '2.5rem' }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="team_leader">Team Leader</option>
            <option value="employee">Employee</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', opacity: 0.6 }} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'visible' }}>
        {/* Header Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '52px 1fr 1fr 130px 160px 140px 100px',
          alignItems: 'center', padding: '0.65rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <span></span>
          <span>Member</span>
          <span>Email</span>
          <span>Role</span>
          <span>Achievements</span>
          <span style={{ paddingLeft: '1rem' }}>Last Login</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UsersIcon size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: '500' }}>No users found</p>
          </div>
        ) : (
          filtered.map((emp, idx) => {
            const meta = ROLE_META[emp.role] || ROLE_META.employee;
            const Icon = meta.icon;
            const isOwn = emp._id === user._id;

            return (
              <div
                key={emp._id}
                style={{
                  display: 'grid', gridTemplateColumns: '52px 1fr 1fr 130px 160px 140px 100px',
                  alignItems: 'center', padding: '0.9rem 1.5rem',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                  animation: `fadeIn 0.3s ease ${idx * 0.03}s both`,
                  position: 'relative',
                  zIndex: actionMenu === emp._id ? 10 : 1
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: getGradient(emp._id),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '0.8rem', color: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {getInitials(emp.name)}
                </div>

                {/* Name */}
                <div>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{emp.name}</span>
                  {isOwn && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.67rem', fontWeight: '700', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                      You
                    </span>
                  )}
                </div>

                {/* Email */}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {emp.email}
                </span>

                {/* Role Badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.26rem 0.62rem', borderRadius: '999px',
                  fontSize: '0.72rem', fontWeight: '700', textTransform: 'capitalize',
                  background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                  letterSpacing: '0.02em', whiteSpace: 'nowrap', justifySelf: 'start'
                }}>
                  <Icon size={11} /> {meta.label}
                </span>

                {/* Achievements */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {['employee', 'team_leader', 'hr'].includes(emp.role) ? (
                    <>
                      <Badge tier={emp.currentBadge || 'none'} size="sm" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Trophy size={11} color="#fbbf24" />
                        {emp.points || 0}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.6 }}>—</span>
                  )}
                </div>

                {/* Last Login */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem', paddingLeft: '1rem' }}>
                  {emp.lastLogin ? (
                    (() => {
                      const parts = formatDateTimeParts(emp.lastLogin);
                      if (!parts) return <span style={{ opacity: 0.5 }}>Never</span>;
                      return (
                        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                          <span>{parts.datePart}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', opacity: 0.85, marginTop: '2px' }}>
                            <Clock size={11} />
                            <span>{parts.timePart}</span>
                          </span>
                        </span>
                      );
                    })()
                  ) : (
                    <span style={{ opacity: 0.5 }}>Never</span>
                  )}
                </div>

                {/* Actions */}
                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {canManage(emp) ? (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setActionMenu(actionMenu === emp._id ? null : emp._id); }}
                        style={{
                          background: 'var(--glass)', border: '1px solid var(--border)',
                          color: 'var(--text-muted)', borderRadius: '8px',
                          padding: '0.35rem 0.7rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.78rem', fontWeight: '500', transition: 'all 0.2s'
                        }}
                      >
                        Manage <ChevronDown size={11} />
                      </button>

                      {actionMenu === emp._id && (
                          <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: '10px', minWidth: '175px', zIndex: 999,
                            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(16px)', overflow: 'hidden',
                            animation: 'fadeIn 0.15s ease'
                          }}
                        >
                          {getAssignableRolesForUser(emp).length > 0 && (
                            <>
                              <div style={{ padding: '0.45rem 0.9rem', fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--border)' }}>
                                Change Role
                              </div>
                              {getAssignableRolesForUser(emp).filter(r => r !== emp.role).map(r => {
                                const rm = ROLE_META[r] || ROLE_META.employee;
                                const RI = rm.icon;
                                return (
                                  <button
                                    key={r}
                                    onClick={(e) => { e.stopPropagation(); handleRoleChange(emp, r); }}
                                    style={{
                                      width: '100%', textAlign: 'left', padding: '0.6rem 0.9rem',
                                      background: 'transparent', border: 'none',
                                      color: 'var(--text-main)', cursor: 'pointer',
                                      fontSize: '0.85rem', fontWeight: '500',
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--glass)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <RI size={13} color={rm.color} />
                                    <span>Make {rm.label}</span>
                                  </button>
                                );
                              })}
                            </>
                          )}

                          <div style={{ borderTop: getAssignableRolesForUser(emp).length > 0 ? '1px solid var(--border)' : 'none' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, emp }); setActionMenu(null); }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '0.6rem 0.9rem',
                                background: 'transparent', border: 'none', color: '#fca5a5',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Trash2 size={13} /> Remove User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Permission denied</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.85rem', textAlign: 'right' }}>
          Showing {filtered.length} of {users.length} users
        </p>
      )}

      {/* Add User Drawer */}
      <AddUserDrawer 
        isOpen={showAddDrawer} 
        onClose={() => setShowAddDrawer(false)} 
        onSuccess={onUserAdded} 
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, emp: null })}
        title="Remove User"
        message={`Are you sure you want to remove ${deleteConfirm.emp?.name}? This will revoke their access immediately.`}
        confirmText="Remove"
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Users;
