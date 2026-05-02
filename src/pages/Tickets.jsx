import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config';

import { Plus, Search, Ticket as TicketIcon, Clock, CheckCircle2, AlertCircle, Inbox, Download, BarChart3, RefreshCw, X, PlusCircle } from 'lucide-react';
import NewTicketDrawer from '../components/Tickets/NewTicketDrawer';


const STATUS_CONFIG = {
  pending: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Pending' },
  in_progress: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'In Progress' },
  on_hold: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'On Hold' },
  resolved: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Resolved' },
  completed: { color: '#059669', bg: 'rgba(5,150,105,0.15)', label: 'Verified' },
};

const TYPE_CONFIG = {
  hr: { label: 'HR Request', color: '#fb7185' },
  bug: { label: 'Bug Report', color: '#ef4444' },
  team_leader: { label: 'Team Leader', color: '#c084fc' }
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.25rem 0.65rem', borderRadius: '999px',
      background: cfg.bg, color: cfg.color,
      fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
      whiteSpace: 'nowrap'
    }}>
      {cfg.label}
    </span>
  );
};

const EmptyState = ({ message }) => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
    <Inbox size={44} style={{ opacity: 0.25, marginBottom: '1rem' }} />
    <p style={{ fontWeight: '500', fontSize: '1rem' }}>{message}</p>
    <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Try adjusting your filters or create a new ticket.</p>
  </div>
);

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none', border: 'none', color: active ? 'var(--primary)' : 'var(--text-muted)',
      fontSize: '0.95rem', fontWeight: '600', padding: '0.5rem 0.2rem', cursor: 'pointer',
      position: 'relative', transition: 'all 0.2s'
    }}
  >
    {label}
    {active && <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: '2px', background: 'var(--primary)' }} />}
  </button>
);

const Tickets = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilterState] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    if (user.role === 'employee' || user.role === 'hr') return 'assigned';
    return 'all_tickets';
  });
  const [stats, setStats] = useState(null);
  const [showReportSidebar, setShowReportSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [exporting, setExporting] = useState(false);
  const [showNewTicketDrawer, setShowNewTicketDrawer] = useState(false);



  // Only show type filter next to search bar on All Tickets Overview tab
  const showTypeFilterInBar =
    ['admin', 'team_leader'].includes(user.role) && activeTab === 'all_tickets';

  const getGridTemplate = () => {
    return '70px 1fr 110px 120px 100px 110px 110px';
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      const allTickets = Array.isArray(data) ? data : [];
      if (allTickets.length === 0) return;

      const headers = ['ID', 'Title', 'Type', 'Priority', 'Status', 'Requester', 'Assignee', 'Created At'];
      const rows = allTickets.map(t => [
        t._id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.type,
        t.priority,
        t.status,
        t.createdBy?.name || 'Unknown',
        t.assignedTo?.name || 'Unassigned',
        new Date(t.createdAt).toLocaleString()
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tickets_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // Honour status param from dashboard links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('status');
    if (s) setStatusFilterState(s);
  }, [location.search]);

  const fetchTickets = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/tickets`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [user.token, user.role]);

  const fetchStats = () => {
    const endpoint = (user.role === 'admin' || user.role === 'team_leader') ? '/api/stats/admin' : '/api/stats/employee';
    fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Stats fetch failed:', err));
  };

  const filtered = tickets.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchSearch = t.title.toLowerCase().includes(q) ||
      (t._id.slice(-6)).toLowerCase().includes(q) ||
      (t.createdBy?.name || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;

    let matchCategory = true;
    if (user.role === 'employee' || user.role === 'hr') {
      if (activeTab === 'assigned') matchCategory = t.assignedTo?._id === user._id;
      else matchCategory = (t.createdBy?._id || t.createdBy) === user?._id;
    } else if (user.role === 'team_leader') {
      if (activeTab === 'all_tickets') matchCategory = true;
      else matchCategory = (t.createdBy?._id || t.createdBy) === user?._id;
    } else if (user.role === 'admin') {
      if (activeTab === 'hr_pool') matchCategory = t.type === 'hr';
      else if (activeTab === 'team_leader_pool') matchCategory = t.createdBy?.role === 'team_leader';
      else if (activeTab === 'employee_pool') matchCategory = ['employee', 'bug'].includes(t.type);
      else if (activeTab === 'all_tickets') matchCategory = true;
      else matchCategory = (t.createdBy?._id || t.createdBy) === user?._id;
    } else if (user.role === 'client') {
      matchCategory = (t.createdBy?._id || t.createdBy) === user?._id;
    } else {
      matchCategory = !typeFilter || t.type === typeFilter;
    }

    // Type filter only applied when in All Tickets Overview
    const matchType = !showTypeFilterInBar || !typeFilter || t.type === typeFilter;

    return matchSearch && matchStatus && matchCategory && matchType;
  });

  // Role-aware header
  const pageTitle = {
    admin: 'All Tickets',
    team_leader: 'Tickets Management',
    employee: 'Tickets',
    client: 'My Bug Reports',
  }[user.role] || 'Tickets';

  const pageSubtitle = {
    admin: 'Manage, assign, and resolve support tickets.',
    team_leader: 'Oversee and manage your team tickets.',
    employee: 'Your assigned and available tickets.',
    client: 'Track and manage your submitted bug reports.',
  }[user.role] || '';

  return (
    <div className="main-content animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>{pageTitle}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{pageSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {user.role === 'admin' && (
            <>
              <button onClick={handleExportCSV} className="btn btn-outline" disabled={exporting} style={{ flexShrink: 0 }}>
                <Download size={18} /> {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button onClick={() => setShowNewTicketDrawer(true)} className="btn btn-primary" style={{ flexShrink: 0 }}>
                <PlusCircle size={18} /> New Ticket
              </button>
            </>
          )}
          {user.role !== 'admin' && (
            <button onClick={() => setShowNewTicketDrawer(true)} className="btn btn-primary" style={{ flexShrink: 0 }}>
              <Plus size={18} /> New Ticket
            </button>
          )}
        </div>
      </header>

      {/* Report Sidebar — Admins only */}
      {user.role === 'admin' && showReportSidebar && (
        <>
          <div
            onClick={() => setShowReportSidebar(false)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000, backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, width: '400px', height: '100%',
            background: 'var(--bg-dark)', borderLeft: '1px solid var(--border)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 1001,
            display: 'flex', flexDirection: 'column', padding: '2rem',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BarChart3 size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Report Snapshot</h2>
              </div>
              <button onClick={() => setShowReportSidebar(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'var(--glass)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Efficiency Metrics</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Resolution</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats?.avgResolutionHours?.toFixed(1) || 0} hrs</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unassigned Tickets</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', color: stats?.unassigned > 0 ? '#ef4444' : 'inherit' }}>{stats?.unassigned || 0}</p>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--glass)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Status Breakdown</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{(stats?.byStatus || []).length} Status Groups</p>
                </div>

                <div style={{ background: 'var(--glass)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Priority Groups</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{(stats?.byPriority || []).length} Levels</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => { handleExportCSV(); setShowReportSidebar(false); }} disabled={exporting} style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
                <Download size={18} /> {exporting ? 'Generating Report...' : 'Download Full CSV'}
              </button>
              <button className="btn btn-outline" onClick={fetchStats} style={{ width: '100%', justifyContent: 'center' }}>
                <RefreshCw size={16} /> Refresh Data
              </button>
            </div>
          </div>
        </>
      )}

      {/* Snapshots / Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total', value: stats.total, color: '#6366f1', icon: TicketIcon },
            { label: 'Pending', value: stats.pending, color: '#ef4444', icon: AlertCircle },
            { label: 'In Progress', value: stats.inProgress, color: '#6366f1', icon: Clock },
            { label: 'Completed', value: stats.completed, color: '#10b981', icon: CheckCircle2 },
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: `3px solid ${stat.color}` }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{stat.label}</p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stat.value ?? 0}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employee / HR Tabs */}
      {(user.role === 'employee' || user.role === 'hr') && (
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.2rem' }}>
          <TabButton active={activeTab === 'assigned'} onClick={() => setActiveTab('assigned')} label={user.role === 'hr' ? 'Assigned to HR' : 'Assigned to Me'} />
          <TabButton active={activeTab === 'my_requests'} onClick={() => setActiveTab('my_requests')} label="My Requests" />
        </div>
      )}

      {/* Team Leader Tabs */}
      {user.role === 'team_leader' && (
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.2rem' }}>
          <TabButton active={activeTab === 'all_tickets'} onClick={() => setActiveTab('all_tickets')} label="All Overview" />
          <TabButton active={activeTab === 'my_requests'} onClick={() => setActiveTab('my_requests')} label="My Requests" />
        </div>
      )}

      {/* Admin Tabs */}
      {user.role === 'admin' && (
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.2rem' }}>
          <TabButton active={activeTab === 'all_tickets'} onClick={() => setActiveTab('all_tickets')} label="All Tickets Overview" />
          <TabButton active={activeTab === 'hr_pool'} onClick={() => setActiveTab('hr_pool')} label="HR Internal" />
          <TabButton active={activeTab === 'team_leader_pool'} onClick={() => setActiveTab('team_leader_pool')} label="Team Leader" />
          <TabButton active={activeTab === 'employee_pool'} onClick={() => setActiveTab('employee_pool')} label="Employee Tickets" />
        </div>
      )}

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = tickets.filter(t => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilterState(statusFilter === key ? '' : key)}
              style={{
                padding: '0.35rem 0.9rem', borderRadius: '999px',
                background: statusFilter === key ? cfg.bg : 'var(--glass)',
                border: `1px solid ${statusFilter === key ? cfg.color : 'var(--border)'}`,
                color: statusFilter === key ? cfg.color : 'var(--text-muted)',
                fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              {cfg.label}
              <span style={{
                background: statusFilter === key ? cfg.color : 'rgba(255,255,255,0.1)',
                color: statusFilter === key ? '#000' : 'var(--text-muted)',
                padding: '0 0.4rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700'
              }}>{count}</span>
            </button>
          );
        })}
        {statusFilter && (
          <button
            onClick={() => setStatusFilterState('')}
            style={{ padding: '0.35rem 0.9rem', borderRadius: '999px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Search + filters bar */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search by title, ID, or requester…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.3rem', marginBottom: 0, fontSize: '0.875rem' }}
            />
          </div>
          {/* ── Type filter: ONLY visible on All Tickets Overview ── */}
          {showTypeFilterInBar && (
            <select
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px', marginBottom: 0, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              <option value="">All Types</option>
              <option value="employee">Employee Tickets</option>
              <option value="hr">HR Tickets</option>
            </select>
          )}
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: getGridTemplate(),
          alignItems: 'center', padding: '0.65rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <span>ID</span>
          <span>Subject</span>
          <span>Type</span>

          <span>Status</span>
          <span>Priority</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px', border: '3px solid var(--border)',
              borderTop: '3px solid var(--primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem'
            }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading tickets…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No tickets match your search or filter." />
        ) : (
          filtered.map((ticket, idx) => {
            const typeCfg = TYPE_CONFIG[ticket.type] || { label: ticket.type, color: '#94a3b8' };
            return (
              <div
                key={ticket._id}
                onClick={() => navigate(`/tickets/${ticket._id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: getGridTemplate(),
                  alignItems: 'center', padding: '0.9rem 1.5rem',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s ease',
                  animation: `fadeIn 0.3s ease ${idx * 0.03}s both`
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: '600' }}>
                  #{ticket._id.slice(-6).toUpperCase()}
                </span>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.title}
                  </p>
                  {(user.role === 'admin' || user.role === 'team_leader') && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1px' }}>
                      by {ticket.createdBy?.name}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: '0.72rem', fontWeight: '600', textTransform: 'capitalize',
                  color: typeCfg.color, padding: '0.2rem 0.6rem',
                  background: `${typeCfg.color}18`, borderRadius: '999px',
                  border: `1px solid ${typeCfg.color}33`, whiteSpace: 'nowrap', justifySelf: 'start'
                }}>
                  {typeCfg.label}
                </span>

                <StatusBadge status={ticket.status} />
                <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column' }}>
                  <span>{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>View</button>
                </div>
              </div>
            );
          })
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Showing {filtered.length} of {tickets.length} tickets
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <NewTicketDrawer
        isOpen={showNewTicketDrawer}
        onClose={() => setShowNewTicketDrawer(false)}
        onSuccess={fetchTickets}
      />
    </div>
  );
};

export default Tickets;