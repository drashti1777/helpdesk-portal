import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, Legend,
} from 'recharts';
import {
  Ticket as TicketIcon, AlertCircle, CheckCircle2, Clock,
  Users, TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  PlusCircle, Inbox, Briefcase, Award, Activity, Target, ChevronRight,
  Sun,
} from 'lucide-react';
import Loader from '../components/Branding/Loader';

const PRIORITY_COLORS = { low: '#13deb9', medium: '#ffae1f', high: '#fa896b' };
const TYPE_COLORS = ['#5d87ff', '#49beff', '#13deb9', '#ffae1f', '#fa896b', '#8e63ce'];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ─── Reusable Pieces ───────────────────────────────────────────────────────
const SectionCard = ({ children, title, action, padding = '1.5rem', style }) => (
  <div className="surface-card" style={{ padding: 0, overflow: 'hidden', ...style }}>
    {(title || action) && (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)' }}>{title}</h3>
        {action || (
          <button style={iconBtn}>
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>
    )}
    <div style={{ padding }}>{children}</div>
  </div>
);

const iconBtn = {
  width: 30, height: 30, borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-muted)', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-muted)',
};

// ─── Hero Card ─────────────────────────────────────────────────────────────
const HeroCard = ({ user, total, navigate }) => (
  <div className="surface-card" style={{
    padding: '1.5rem 1.75rem',
    background: 'linear-gradient(135deg, var(--primary-soft) 0%, #f8fbff 100%)',
    border: '1px solid var(--border)',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: -40, right: -40, width: 180, height: 180,
      background: 'radial-gradient(circle, rgba(73,190,255,0.2) 0%, transparent 70%)',
      borderRadius: '50%',
    }} />
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ flex: '1 1 280px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h2>
          <Sun size={20} color="var(--warning)" />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
          You have <strong style={{ color: 'var(--primary)' }}>{total ?? 0}</strong> tickets in the system today.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/tickets')}
          style={{ borderRadius: '999px', padding: '0.65rem 1.4rem' }}
        >
          View All Tickets <ChevronRight size={16} />
        </button>
      </div>

      {/* Decorative illustration */}
      <div style={{
        width: 180, height: 130, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} className="hide-mobile">
        <div style={{
          width: 130, height: 110, background: '#fff',
          borderRadius: 14, border: '1px solid var(--border)',
          padding: 12, boxShadow: '0 12px 28px rgba(45,55,72,0.08)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ height: 8, width: '60%', borderRadius: 4, background: 'var(--primary)' }} />
          <div style={{ height: 6, width: '90%', borderRadius: 3, background: 'var(--border)' }} />
          <div style={{ height: 6, width: '80%', borderRadius: 3, background: 'var(--border)' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
            {['var(--success)', 'var(--warning)', 'var(--danger)'].map((c, i) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: 6, background: c, opacity: 0.8 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── KPI tile (matches Spike Sales/Refunds/Earnings cards) ────────────────
// eslint-disable-next-line no-unused-vars
const KpiTile = ({ label, value, delta, deltaPositive, icon: Icon, color, accent, onClick }) => (
  <div
    className="surface-card"
    onClick={onClick}
    style={{
      padding: '1.5rem',
      cursor: onClick ? 'pointer' : 'default',
      background: color,
      color: '#fff',
      position: 'relative', overflow: 'hidden',
      border: 'none',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(45,55,72,0.15)'; } }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
  >
    <div style={{
      position: 'absolute', top: -30, right: -30, width: 120, height: 120,
      borderRadius: '50%', background: accent, opacity: 0.45,
    }} />
    <div style={{
      position: 'absolute', top: 70, right: -10, width: 60, height: 60,
      borderRadius: '50%', background: '#fff', opacity: 0.12,
    }} />
    <div style={{ position: 'relative' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, color: '#fff',
      }}>
        <Icon size={22} />
      </div>
      <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1 }}>{value ?? 0}</div>
        {delta != null && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontSize: '0.78rem', fontWeight: 700,
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px', borderRadius: 999,
          }}>
            {deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {delta}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─── Charts ────────────────────────────────────────────────────────────────
const TicketsTrendChart = ({ data }) => {
  if (!data || !data.length) {
    return <EmptyChart label="No trend data yet" />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
        <XAxis dataKey="day" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--bg-muted)' }}
          contentStyle={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', fontSize: '0.85rem', boxShadow: 'var(--shadow-md)',
          }}
        />
        <Bar dataKey="created" name="Created" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={14} />
        <Bar dataKey="resolved" name="Resolved" fill="var(--secondary)" radius={[6, 6, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const ResolutionAreaChart = ({ data }) => {
  if (!data || !data.length) return <EmptyChart label="No resolution data" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', fontSize: '0.85rem', boxShadow: 'var(--shadow-md)',
          }}
        />
        <Area type="monotone" dataKey="resolved" stroke="var(--primary)" strokeWidth={2.5} fill="url(#resGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const PriorityDonut = ({ data }) => {
  if (!data || !data.length) return <EmptyChart label="No priority data" />;
  const items = data.map(d => ({
    name: (d._id || 'unknown').toUpperCase(),
    value: d.count,
    color: PRIORITY_COLORS[d._id] || '#94a3b8',
  }));
  const total = items.reduce((sum, x) => sum + x.value, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={items} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={3} startAngle={90} endAngle={-270}>
            {items.map((it, i) => <Cell key={i} fill={it.color} stroke="none" />)}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.82rem' }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => {
          const pct = total ? Math.round((it.value / total) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: it.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)' }}>{it.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{it.value} • {pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TypeChart = ({ data }) => {
  if (!data || !data.length) return <EmptyChart label="No type data" />;
  const items = data.map((d, i) => ({
    name: (d._id || 'other').toUpperCase(),
    value: d.count,
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={items} dataKey="value" innerRadius={40} outerRadius={80} paddingAngle={2}>
          {items.map((it, i) => <Cell key={i} fill={it.color} stroke="none" />)}
        </Pie>
        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.82rem' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const EmptyChart = ({ label }) => (
  <div style={{
    height: 220, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)',
  }}>
    <Inbox size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
    <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</p>
  </div>
);

// ─── Recent tickets list ───────────────────────────────────────────────────
const STATUS_BADGE = {
  pending:     { bg: 'var(--danger-soft)',  color: 'var(--danger)',  label: 'Pending' },
  in_progress: { bg: 'var(--info-soft)',    color: 'var(--info)',    label: 'In Progress' },
  on_hold:     { bg: 'var(--warning-soft)', color: 'var(--warning)', label: 'On Hold' },
  resolved:    { bg: 'var(--success-soft)', color: 'var(--success)', label: 'Resolved' },
  completed:   { bg: 'var(--success-soft)', color: 'var(--success)', label: 'Completed' },
};

const getInitials = (name = '') => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const RecentTickets = ({ tickets, navigate }) => {
  if (!tickets || !tickets.length) {
    return <EmptyChart label="No recent tickets" />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tickets.slice(0, 6).map((t, i) => {
        const cfg = STATUS_BADGE[t.status] || { bg: 'var(--bg-muted)', color: 'var(--text-muted)', label: t.status };
        return (
          <div
            key={t._id}
            onClick={() => navigate(`/tickets/${t._id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '0.85rem 0.25rem',
              borderBottom: i < tickets.length - 1 && i < 5 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', transition: 'background 0.15s ease',
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0,
            }}>
              {getInitials(t.createdBy?.name || 'NA')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                #{t._id.slice(-6).toUpperCase()} • {t.createdBy?.name || 'Unknown'}
              </div>
            </div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem',
              borderRadius: 999, background: cfg.bg, color: cfg.color,
              textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
            }}>
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const TopAssigneesList = ({ data }) => {
  if (!data || !data.length) return <EmptyChart label="No assignee data" />;
  const max = Math.max(...data.map(d => d.resolved || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {data.slice(0, 5).map((u, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{getInitials(u.name)}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)' }}>{u.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role?.replace('_', ' ')}</div>
              </div>
            </div>
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)',
              background: 'var(--success-soft)', padding: '2px 10px', borderRadius: 999,
            }}>
              {u.resolved} <span style={{ fontWeight: 500, opacity: 0.8 }}>resolved</span>
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(u.resolved / max) * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
              borderRadius: 6,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Goals progress card (Spike "New Goals" style) ─────────────────────────
const GoalsCard = ({ stats }) => {
  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="surface-card" style={{
      padding: '1.5rem',
      background: 'linear-gradient(135deg, var(--success-soft) 0%, #f8fffd 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--success)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <Target size={22} />
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>Resolution Goal</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>{pct}%</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>of {total} tickets</span>
      </div>
      <div style={{ height: 6, background: 'rgba(19,222,185,0.18)', borderRadius: 6, marginTop: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--success)', borderRadius: 6,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
};

// ─── Main Dashboard Component ──────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const isElevated = ['admin', 'team_leader'].includes(user.role);
        const statsUrl = isElevated ? '/api/stats/admin' : '/api/stats/employee';
        const [statsRes, projRes] = await Promise.all([
          fetch(`${API_BASE_URL}${statsUrl}`, { headers: { Authorization: `Bearer ${user.token}` } }),
          fetch(`${API_BASE_URL}/api/projects`, { headers: { Authorization: `Bearer ${user.token}` } }),
        ]);
        const statsData = await statsRes.json();
        const projData = await projRes.json();
        if (!isMounted) return;
        setStats(statsData);
        setProjects(Array.isArray(projData) ? projData : []);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, [user.token, user.role]);

  if (loading) return <Loader fullscreen label="Loading dashboard" />;

  const isElevated = ['admin', 'team_leader'].includes(user.role);
  const total = stats?.total || 0;
  const open = (stats?.pending || 0) + (stats?.inProgress || 0);
  const completed = stats?.completed || 0;
  const trendData = stats?.dailyTrend || [];

  return (
    <div className="main-content animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
            A complete snapshot of your support operations.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
          <PlusCircle size={16} /> New Ticket
        </button>
      </div>

      {/* Top row: hero + 3 KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
        gap: '1.25rem', marginBottom: '1.25rem',
      }}>
        <HeroCard user={user} total={total} navigate={navigate} />
        <KpiTile
          label="Open Tickets" value={open}
          icon={AlertCircle}
          color="linear-gradient(135deg, #5d87ff, #4570ea)"
          accent="rgba(255,255,255,0.18)"
          onClick={() => navigate('/tickets?status=pending')}
        />
        <KpiTile
          label="Resolved" value={completed}
          icon={CheckCircle2}
          color="linear-gradient(135deg, #13deb9, #0caa8e)"
          accent="rgba(255,255,255,0.18)"
          onClick={() => navigate('/tickets?status=completed')}
        />
        <KpiTile
          label="Total Tickets" value={total}
          icon={TicketIcon}
          color="linear-gradient(135deg, #49beff, #2a9bdf)"
          accent="rgba(255,255,255,0.18)"
          onClick={() => navigate('/tickets')}
        />
      </div>

      {/* Middle row: trend chart + product/sales-style line chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: '1.25rem', marginBottom: '1.25rem',
      }}>
        <SectionCard title="Tickets Activity" padding="1.25rem 1.5rem">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: '1.5rem', alignItems: 'center' }}>
            <TicketsTrendChart data={trendData} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <SummaryLine
                label="Open"
                value={open}
                icon={<Activity size={18} />}
                color="var(--primary)"
                bg="var(--primary-soft)"
              />
              <SummaryLine
                label="Resolved"
                value={completed}
                icon={<CheckCircle2 size={18} />}
                color="var(--success)"
                bg="var(--success-soft)"
              />
              {isElevated && (
                <SummaryLine
                  label="Avg. resolution"
                  value={stats?.avgResolutionHrs != null ? `${stats.avgResolutionHrs}h` : '—'}
                  icon={<Clock size={18} />}
                  color="var(--warning)"
                  bg="var(--warning-soft)"
                />
              )}
              <button
                onClick={() => navigate('/tickets')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              >
                View Full Report
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Resolution Trend" padding="1.25rem 1.5rem">
          <ResolutionAreaChart data={trendData} />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--primary-soft)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>{completed}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tickets resolved</div>
              </div>
            </div>
            <span style={{
              background: 'var(--success-soft)', color: 'var(--success)',
              fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999,
            }}>
              <ArrowUpRight size={12} style={{ verticalAlign: 'middle' }} /> All-time
            </span>
          </div>
        </SectionCard>
      </div>

      {/* Lower row: goal + donut + projects mini */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1.4fr)',
        gap: '1.25rem', marginBottom: '1.25rem',
      }}>
        <GoalsCard stats={stats} />

        <SectionCard title="Tickets by Priority" padding="1.5rem">
          <PriorityDonut data={stats?.byPriority || []} />
        </SectionCard>

        <SectionCard
          title="Active Projects"
          padding="0"
          action={
            <button
              onClick={() => navigate('/projects')}
              className="btn btn-ghost"
              style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
            >
              See all <ChevronRight size={14} />
            </button>
          }
        >
          <div style={{ padding: '0.5rem 0' }}>
            {projects.length === 0 ? (
              <EmptyChart label="No projects yet" />
            ) : projects.slice(0, 4).map((p, i) => (
              <div
                key={p._id}
                onClick={() => navigate('/projects')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.7rem 1.5rem',
                  borderBottom: i < Math.min(projects.length, 4) - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: TYPE_COLORS[i % TYPE_COLORS.length] + '22',
                  color: TYPE_COLORS[i % TYPE_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.78rem', flexShrink: 0,
                }}>
                  {getInitials(p.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.teamMembers?.length || 0} members • {p.client?.name || 'Internal'}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-subtle)" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Bottom row: recent tickets + top assignees */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: '1.25rem',
      }}>
        <SectionCard
          title="Recent Tickets"
          padding="0.5rem 1.5rem 1rem"
          action={
            <button
              onClick={() => navigate('/tickets')}
              className="btn btn-ghost"
              style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
            >
              See all <ChevronRight size={14} />
            </button>
          }
        >
          <RecentTickets tickets={stats?.recentTickets || stats?.assignedTickets || []} navigate={navigate} />
        </SectionCard>

        <SectionCard title={isElevated ? 'Top Performers' : 'My Workload'} padding="1.25rem 1.5rem">
          {isElevated ? (
            <TopAssigneesList data={stats?.topAssignees || []} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SummaryLine label="Pending" value={stats?.pending || 0} icon={<AlertCircle size={18} />} color="var(--danger)" bg="var(--danger-soft)" />
              <SummaryLine label="In Progress" value={stats?.inProgress || 0} icon={<Clock size={18} />} color="var(--info)" bg="var(--info-soft)" />
              <SummaryLine label="On Hold" value={stats?.onHold || 0} icon={<Activity size={18} />} color="var(--warning)" bg="var(--warning-soft)" />
              <SummaryLine label="Resolved" value={stats?.completed || 0} icon={<CheckCircle2 size={18} />} color="var(--success)" bg="var(--success-soft)" />
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

const SummaryLine = ({ label, value, icon, color, bg }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0.65rem 0.75rem', borderRadius: 'var(--radius)',
    background: bg, border: `1px solid ${color}22`,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: '#fff', color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-xs)',
    }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
    </div>
  </div>
);

export default Dashboard;
