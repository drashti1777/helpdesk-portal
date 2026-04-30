import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie, Legend,
  AreaChart, Area
} from 'recharts';
import {
  AlertCircle, CheckCircle2, Clock, ListTodo, ShieldCheck, Users,
  UserCheck, TrendingUp, Globe, Briefcase, Inbox, RefreshCw,
  ChevronRight, ArrowRight, Zap, PlusCircle, Award, Star,
  Target, Activity, BarChart2, Trophy
} from 'lucide-react';
import NewTicketDrawer from '../components/Tickets/NewTicketDrawer';
import Leaderboard from './Leaderboard';



// ── Shared helpers ──────────────────────────────────────────────────────────

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const BAR_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ label, value, icon: Icon, iconColor, onClick, accent }) => (
  <div
    className="glass-card"
    onClick={onClick}
    style={{
      padding: '1.25rem 1.5rem', cursor: onClick ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', gap: '1rem',
      borderLeft: accent ? `3px solid ${accent}` : undefined,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'; } }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
  >
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
      background: `${iconColor}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Icon size={22} color={iconColor} />
    </div>
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.2rem' }}>{label}</p>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', lineHeight: 1 }}>{value ?? '—'}</h2>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
    {children}
  </h3>
);

const PriorityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        <BarChart2 size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>No priority data found</p>
      </div>
    );
  }

  const chartData = (data || []).map(item => ({
    name: item._id ? item._id.toUpperCase() : 'N/A',
    count: item.count,
    color: PRIORITY_COLORS[item._id] || '#6366f1'
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={36}>
        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
          itemStyle={{ color: 'var(--text-main)' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ── Role Dashboards ─────────────────────────────────────────────────────────

// AdminDashboard will now handle what Super Admin used to see as well
const AdminDashboard = ({ stats, navigate }) => (
  <>
    <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>System Overview</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Full management oversight of all tickets and system users.</p>
      </div>
    </header>

    <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
      <StatCard label="Total Tickets" value={stats.total} icon={ListTodo} iconColor="#6366f1" onClick={() => navigate('/tickets')} accent="#6366f1" />
      <StatCard label="Pending" value={stats.pending} icon={AlertCircle} iconColor="#ef4444" onClick={() => navigate('/tickets?status=pending')} accent="#ef4444" />
      <StatCard label="In Progress" value={stats.inProgress} icon={Clock} iconColor="#6366f1" onClick={() => navigate('/tickets?status=in_progress')} accent="#6366f1" />
      <StatCard label="On Hold" value={stats.onHold} icon={AlertCircle} iconColor="#f59e0b" onClick={() => navigate('/tickets?status=on_hold')} accent="#f59e0b" />
      <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} iconColor="#10b981" onClick={() => navigate('/tickets?status=completed')} accent="#10b981" />
      <StatCard label="Unassigned" value={stats.unassigned} icon={Inbox} iconColor="#ef4444" onClick={() => navigate('/tickets')} accent="#ef4444" />
    </div>



    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
      {/* Main Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Tickets by Type */}
        <div className="glass-card">
          <SectionTitle>Tickets by Type</SectionTitle>
          {!(stats.byType?.length > 0) ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ListTodo size={32} style={{ opacity: 0.2, margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>No ticket data available</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              {stats.byType.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize', fontSize: '0.9rem' }}>{item._id} tickets</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tickets */}
        <div className="glass-card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <SectionTitle>Recent Tickets</SectionTitle>
          </div>
          {!(stats.recentTickets?.length > 0) ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ListTodo size={40} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>No recent tickets</p>
            </div>
          ) : (
            stats.recentTickets.map((t, i) => (
              <div
                key={t._id}
                onClick={() => navigate(`/tickets/${t._id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto',
                  alignItems: 'center', padding: '0.9rem 1.5rem',
                  borderBottom: i < stats.recentTickets.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--glass)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{t.title}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.1rem' }}>
                    by {t.createdBy?.name} · {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                <span style={{
                  marginLeft: '1rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize',
                  color: t.status === 'pending' ? 'var(--danger)' : t.status === 'completed' ? 'var(--success)' : t.status === 'on_hold' ? 'var(--warning)' : 'var(--primary)'
                }}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card">
          <SectionTitle>Overall Priority</SectionTitle>
          <PriorityChart data={stats.byPriority} />
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#a5b4fc' }}>📊 System Status</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            The system is currently monitoring {stats.total} total tickets.
            {stats.unassigned > 0 ? ` There are ${stats.unassigned} tickets awaiting assignment.` : ' All tickets are assigned.'}
          </p>
        </div>
      </div>
    </div>
  </>
);

// ── Status & Priority config ─────────────────────────────────────────────────
const STATUS_CFG = {
  pending: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Pending' },
  in_progress: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'In Progress' },
  on_hold: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'On Hold' },
  completed: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Completed' },
};

const PriorityDot = ({ p }) => (
  <span style={{
    display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', marginRight: '5px',
    background: p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#10b981'
  }} />
);

// ── Inline-editable ticket row ──────────────────────────────────────────────
const TicketRow = ({ ticket, onStatusChange, onPriorityChange, onNavigate, showClaim, onClaim, currentUserId }) => {
  const isOwner = ticket.createdBy?._id === currentUserId || ticket.createdBy === currentUserId;
  const s = STATUS_CFG[ticket.status] || STATUS_CFG.pending;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: showClaim ? '1fr 120px 100px 100px' : '1fr 130px 110px 110px',
        alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Title + meta */}
      <div style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => onNavigate(ticket._id)}>
        <p style={{ fontWeight: '500', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ticket.title}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '1px' }}>
          #{ticket._id.slice(-6).toUpperCase()} · {ticket.createdBy?.name}
        </p>
      </div>

      {/* Inline Status selector */}
      {!showClaim ? (
        <select
          value={ticket.status}
          onChange={e => onStatusChange(ticket._id, e.target.value)}
          onClick={e => e.stopPropagation()}
          disabled={isOwner}

          style={{
            marginBottom: 0, padding: '0.3rem 0.5rem', fontSize: '0.75rem',
            fontWeight: '600', cursor: 'pointer',
            background: s.bg, color: s.color,
            border: `1px solid ${s.color}44`,
            borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.04em'
          }}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      ) : (
        <span style={{
          padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem',
          fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
          background: s.bg, color: s.color, whiteSpace: 'nowrap'
        }}>{s.label}</span>
      )}

      {/* Priority */}
      {!showClaim ? (
        <select
          value={ticket.priority}
          onChange={e => onPriorityChange(ticket._id, e.target.value)}
          onClick={e => e.stopPropagation()}
          disabled={isOwner}

          style={{
            marginBottom: 0, padding: '0.3rem 0.5rem', fontSize: '0.75rem',
            cursor: 'pointer', background: 'var(--glass)', color: 'var(--text-main)',
            border: '1px solid var(--border)', borderRadius: '8px'
          }}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
      ) : (
        <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
      )}

      {/* Action */}
      {showClaim ? (
        <button
          onClick={() => onClaim(ticket._id)}
          className="btn btn-primary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', justifyContent: 'center' }}
        >
          <Zap size={13} /> Claim
        </button>
      ) : (
        <button
          onClick={() => onNavigate(ticket._id)}
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
        >
          View <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
};

// ── Employee Dashboard (stateful, editable) ──────────────────────────────────
const EmployeeDashboard = ({ stats: initialStats, navigate, token, user, onNewTicket }) => {
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState('assigned'); // assigned | unassigned | raised
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (msg, type = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { type, message: msg } 
    }));
  };

  const refreshStats = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/employee`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Optimistically update
        setStats(prev => ({
          ...prev,
          assignedTickets: prev.assignedTickets?.map(t =>
            t._id === ticketId ? { ...t, status: newStatus } : t
          )
        }));
        showToast(`Status updated to ${newStatus.replace('_', ' ')}`);
        // Refresh stats counters
        refreshStats();
      }
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handlePriorityChange = async (ticketId, priority) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ priority })
      });
      if (res.ok) {
        setStats(prev => ({
          ...prev,
          assignedTickets: prev.assignedTickets?.map(t =>
            t._id === ticketId ? { ...t, priority } : t
          )
        }));
        showToast(`Priority set to ${priority}`);
      }
    } catch { showToast('Failed to update priority', 'error'); }
  };

  const handleClaim = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assignedTo: user._id, status: 'in_progress' })
      });
      if (res.ok) {
        showToast('Ticket claimed and moved to In Progress!');
        refreshStats();
      }
    } catch { showToast('Failed to claim ticket', 'error'); }
  };

  const tabTickets = {
    assigned: stats.assignedTickets || [],
    unassigned: stats.unassignedTickets || [],
    raised: stats.raisedTickets || [],
  }[activeTab];

  const tabConfig = [
    { key: 'assigned', label: 'Assigned to Me', count: stats.total, color: '#6366f1' },
    { key: 'unassigned', label: stats.userRole === 'hr' ? 'Employee Issues' : 'General Pool', count: stats.unassigned, color: '#f59e0b' },
    { key: 'raised', label: 'My Requests', count: stats.myRaisedTickets, color: '#0ea5e9' },
  ];

  return (
    <>


      {/* Header */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.4rem 0.9rem', borderRadius: '999px', background: user.role === 'hr' ? 'rgba(251,113,133,0.12)' : 'rgba(16,185,129,0.12)', border: user.role === 'hr' ? '1px solid rgba(251,113,133,0.25)' : '1px solid rgba(16,185,129,0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={13} color={user.role === 'hr' ? '#fb7185' : '#6ee7b7'} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: user.role === 'hr' ? '#fb7185' : '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{user.role === 'hr' ? 'HR Role' : 'Employee'}</span>
            </div>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>My Workspace</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{user.role === 'hr' ? 'Manage internal HR tickets and track requests.' : 'Manage your tickets, claim new ones, and track your activity.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => onNewTicket()} style={{ fontSize: '0.875rem' }}>
            <PlusCircle size={15} /> New Ticket
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label="Assigned to Me" value={stats.total} icon={ListTodo} iconColor="#6366f1" onClick={() => setActiveTab('assigned')} accent="#6366f1" />
        <StatCard label="Pending" value={stats.pending} icon={AlertCircle} iconColor="#ef4444" onClick={() => setActiveTab('assigned')} accent="#ef4444" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} iconColor="#6366f1" accent="#6366f1" />
        <StatCard label="Resolved" value={stats.completed} icon={CheckCircle2} iconColor="#10b981" accent="#10b981" />
        <StatCard label="Unassigned Pool" value={stats.unassigned} icon={Inbox} iconColor="#ef4444" onClick={() => setActiveTab('unassigned')} accent="#ef4444" />
        <StatCard label="My Raised" value={stats.myRaisedTickets} icon={Award} iconColor="#0ea5e9" onClick={() => setActiveTab('raised')} accent="#0ea5e9" />
      </div>


      {/* Two-column layout: Ticket panels + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT — Interactive Ticket Panel */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            {tabConfig.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '0.85rem 0.5rem',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                  color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                  fontWeight: activeTab === tab.key ? '700' : '500',
                  fontSize: '0.82rem', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                {tab.label}
                <span style={{
                  padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem',
                  background: activeTab === tab.key ? `${tab.color}20` : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                  fontWeight: '700'
                }}>{tab.count ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: activeTab !== 'unassigned' ? '1fr 130px 110px 110px' : '1fr 120px 100px 100px',
            padding: '0.55rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            background: 'rgba(255,255,255,0.01)'
          }}>
            <span>Ticket</span>
            <span>{activeTab === 'unassigned' ? 'Status' : 'Status ✎'}</span>
            <span>{activeTab !== 'unassigned' ? 'Priority ✎' : 'Priority'}</span>
            <span>Action</span>
          </div>

          {/* Rows */}
          {tabTickets.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Inbox size={36} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: '500' }}>
                {activeTab === 'assigned' && 'No active assigned tickets'}
                {activeTab === 'unassigned' && 'No unassigned tickets in the pool'}
                {activeTab === 'raised' && "You haven't raised any tickets yet"}
              </p>
              {activeTab === 'unassigned' && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>All tickets are currently assigned. Great work!</p>
              )}
            </div>
          ) : (
            tabTickets.map(ticket => (
              <TicketRow
                key={ticket._id}
                ticket={ticket}
                showClaim={activeTab === 'unassigned'}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onClaim={handleClaim}
                onNavigate={(id) => navigate(`/tickets/${id}`)}
                currentUserId={user._id}
              />

            ))
          )}

          {tabTickets.length > 0 && (
            <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing {tabTickets.length} tickets</span>
              <button
                onClick={() => navigate('/tickets')}
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Priority Chart + tip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card">
            <SectionTitle>My Workload by Priority</SectionTitle>
            <PriorityChart data={stats.byPriority} />
          </div>

          <div className="glass-card">
            <SectionTitle>My Workload by Type</SectionTitle>
            {!(stats.byType?.length > 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ListTodo size={32} style={{ opacity: 0.2, margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>No workload data available</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.byType.map(item => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize', fontSize: '0.85rem' }}>{item._id}</span>
                    <span style={{ fontWeight: '700', fontSize: '1rem' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick tips */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#a5b4fc' }}>💡 Quick Tips</p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: '1.1rem', margin: 0 }}>
              <li>Use the <strong>Status ✎</strong> dropdown to update inline</li>
              <li>Switch to <strong>Unassigned Pool</strong> to claim new tickets</li>
              <li>Click any ticket title to open full detail</li>
              <li>High priority tickets SLA: 2h response / 8h resolve</li>
            </ul>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};




const endpointMap = {
  admin: '/api/stats/admin',
  team_leader: '/api/stats/admin',
  employee: '/api/stats/employee',
  hr: '/api/stats/employee',
};

// ── Main Dashboard Component ─────────────────────────────────────────────────

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [showNewTicketDrawer, setShowNewTicketDrawer] = useState(false);
  const navigate = useNavigate();

  const fetchStats = useCallback(() => {
    if (!user?.token) return;
    const endpoint = endpointMap[user.role];
    if (!endpoint) return;

    fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => {
        if (res.status === 401) {
          logout();
          navigate('/login', { replace: true });
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => {
        console.error('Stats fetch failed:', err);
        setError('Failed to load dashboard data. Please try again later.');
      });
  }, [user, logout, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (error) {
    return (
      <div className="main-content" style={{ padding: '4rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '44px', height: '44px', border: '3px solid var(--border)',
          borderTop: '3px solid var(--primary)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in">
      {(user.role === 'admin' || user.role === 'team_leader') && <AdminDashboard stats={stats} navigate={navigate} />}
      {(user.role === 'employee' || user.role === 'hr') && <EmployeeDashboard stats={stats} navigate={navigate} token={user.token} user={user} onNewTicket={() => setShowNewTicketDrawer(true)} />}

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
        <Leaderboard embedded={true} />
      </div>

      <NewTicketDrawer 
        isOpen={showNewTicketDrawer} 
        onClose={() => setShowNewTicketDrawer(false)} 
        onSuccess={() => {
          fetchStats(); 
        }}
      />
    </div>
  );
};

export default Dashboard;
