import React, { useState, useContext, useMemo } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Users, Ticket, Bell, LayoutDashboard, Award, HelpCircle, Search, Sparkles, MessageCircle, Mail, ArrowRight, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Each FAQ item has a 'roles' array — only shown to those roles
const FAQ_DATA = [
  {
    category: 'Getting Started',
    icon: HelpCircle,
    color: '#6366f1',
    roles: ['admin', 'team_leader', 'hr', 'employee', 'client'],
    items: [
      { q: 'What is the Helpdesk Portal?', a: 'This is a centralized ticketing and support system where you can raise, track, and resolve issues. Each user has a role-based view tailored to their responsibilities.' },
      { q: 'How do I log in?', a: 'Enter your registered email and password on the login page. If you don\'t have an account, click "Register" to create one. Contact your Admin if you need a specific role assigned.' },
      { q: 'How do I update my profile?', a: 'Click on your name/avatar in the sidebar footer, then go to "Profile". You can update your name, email, and password from there.' },
    ]
  },

  // ──────── ADMIN ────────
  {
    category: 'Admin — Dashboard',
    icon: LayoutDashboard,
    color: '#a5b4fc',
    roles: ['admin'],
    items: [
      { q: 'What does the Admin Dashboard show?', a: 'Your dashboard displays:\n• Stat cards — Total, Pending, In Progress, On Hold, Completed, and Unassigned ticket counts.\n• Tickets by Type — Breakdown of HR, Client, and Employee tickets.\n• Recent Tickets — Latest 10 tickets across the system.\n• Overall Priority — Visual chart of High/Medium/Low distribution.\n• System Status — Live monitoring summary.' },
    ]
  },
  {
    category: 'Admin — Ticket Management',
    icon: Ticket,
    color: '#a5b4fc',
    roles: ['admin'],
    items: [
      { q: 'What ticket tabs are available?', a: 'You have 4 tabs:\n• All Tickets Overview — Every ticket in the system.\n• HR Internal — HR-type tickets.\n• Client Tickets — Client-type tickets.\n• Employee Tickets — Employee-type tickets.' },
      { q: 'How do I assign a ticket?', a: 'Open any ticket → In the right sidebar, use the "Assign Agent" dropdown to select an employee. The assignment takes effect immediately.' },
      { q: 'How do I delete a ticket?', a: 'Open the ticket → Click the "Delete" button (red) → A confirmation popup with Cancel and Delete buttons will appear. Only Admins can delete tickets.' },
      { q: 'How do I export ticket data?', a: 'On the Tickets page, click "Export CSV" to download a full report with ticket ID, title, type, priority, status, requester, assignee, and date.' },
    ]
  },
  {
    category: 'Admin — User Management',
    icon: Users,
    color: '#a5b4fc',
    roles: ['admin'],
    items: [
      { q: 'How do I add a new user?', a: 'Go to "Manage Team" → Click "Add User" → Fill in name, email, temporary password, and role → Click "Create User".' },
      { q: 'How do I change someone\'s role?', a: 'In the team table, click "Manage" on any user → Select the new role from the dropdown. Changes apply immediately.' },
      { q: 'How do I remove a user?', a: 'Click "Manage" → "Remove User" → A confirmation popup appears with Cancel and Remove buttons. Removal revokes access immediately.' },
      { q: 'What roles can I assign?', a: 'You can assign: Admin, Team Leader, HR, Employee, or Client.' },
    ]
  },
  {
    category: 'Admin — Projects & Settings',
    icon: Settings,
    color: '#a5b4fc',
    roles: ['admin'],
    items: [
      { q: 'How do I create a project?', a: 'Go to "Projects" → Enter project name, description, assign a Team Leader → Click "Add Project". All tickets can be linked to a project.' },
      { q: 'How do I delete a project?', a: 'Click the trash icon on any project → A confirmation popup will appear before permanent deletion.' },
      { q: 'What is Admin Control?', a: 'Admin Control lets you configure system-wide settings:\n• Self-registration toggle\n• Maintenance mode\n• Default ticket priority\n• Role-based permissions' },
    ]
  },

  // ──────── TEAM LEADER ────────
  {
    category: 'Team Leader — Dashboard',
    icon: LayoutDashboard,
    color: '#c084fc',
    roles: ['team_leader'],
    items: [
      { q: 'What does my Dashboard show?', a: 'Your dashboard is the same as Admin\'s:\n• Stat cards for all ticket statuses.\n• Tickets by Type breakdown.\n• Recent Tickets list.\n• Overall Priority chart.\n• System Status summary.' },
    ]
  },
  {
    category: 'Team Leader — Ticket Management',
    icon: Ticket,
    color: '#c084fc',
    roles: ['team_leader'],
    items: [
      { q: 'What ticket tabs do I see?', a: 'You have 3 tabs:\n• All Overview — All tickets in the system.\n• Client Support Pool — Client-type tickets only.\n• My Requests — Tickets you raised yourself.' },
      { q: 'Can I assign tickets to employees?', a: 'Yes! Open any client or HR ticket → Use "Assign Agent" to pick an employee. For client tickets, you can assign to employees. For HR tickets, you can assign to HR staff.' },
      { q: 'What ticket types can I create?', a: '• For Client — Create a ticket on behalf of a client.\n• For Employee — Create an internal ticket for an employee.' },
    ]
  },
  {
    category: 'Team Leader — Team Management',
    icon: Users,
    color: '#c084fc',
    roles: ['team_leader'],
    items: [
      { q: 'Who can I manage?', a: 'You can manage Employees and Clients only. Admin accounts are restricted and cannot be modified by Team Leaders.' },
      { q: 'Can I change roles?', a: 'You can toggle users between Team Leader and Employee roles only.' },
      { q: 'Can I add new users?', a: 'Yes! Click "Add User" in Manage Team to create new Employee or Client accounts.' },
    ]
  },

  // ──────── HR ────────
  {
    category: 'HR — Dashboard',
    icon: LayoutDashboard,
    color: '#fb7185',
    roles: ['hr'],
    items: [
      { q: 'What does my Dashboard show?', a: 'Your workspace displays:\n• Stat cards — Total assigned, Pending, In Progress, On Hold, Completed counts.\n• Tabbed view — "Assigned to HR" and "My Requests" sections.\n• Workload by Priority — Chart showing High/Medium/Low distribution.\n• Workload by Type — Breakdown of your tickets by type (HR, Employee).' },
    ]
  },
  {
    category: 'HR — Tickets',
    icon: Ticket,
    color: '#fb7185',
    roles: ['hr'],
    items: [
      { q: 'What ticket types can I create?', a: '• HR Issue — Your own HR/admin problems. These go to Admin for resolution.\n• For Employee — When you need to suggest, assign, or communicate something to an employee.' },
      { q: 'What tabs do I see on the Tickets page?', a: '• Assigned to HR — Tickets assigned to you.\n• My Requests — Tickets you raised yourself.' },
      { q: 'How do I create a ticket?', a: 'Click "New Ticket" → Choose "HR Issue" or "For Employee" → Fill in subject, project, description → Set priority → Submit.' },
      { q: 'Can I update ticket status?', a: 'Yes, for tickets assigned to you. Open the ticket → Use "Start Working", "Hold", or "Resolve" buttons to change status.' },
    ]
  },

  // ──────── EMPLOYEE ────────
  {
    category: 'Employee — Dashboard',
    icon: LayoutDashboard,
    color: '#6ee7b7',
    roles: ['employee'],
    items: [
      { q: 'What does my Dashboard show?', a: 'Your workspace shows:\n• Stat cards — Assigned, Pending, In Progress, On Hold, Completed, My Raised, and Unassigned Pool counts.\n• Three tabs — "Assigned to Me", "Unassigned Pool", and "I Raised".\n• Workload by Priority — Chart on the right sidebar.\n• Workload by Type — Ticket type breakdown.\n• Quick Tips — Helpful reminders.' },
    ]
  },
  {
    category: 'Employee — Tickets',
    icon: Ticket,
    color: '#6ee7b7',
    roles: ['employee'],
    items: [
      { q: 'How do I claim an unassigned ticket?', a: 'On the Dashboard → Switch to "Unassigned Pool" tab → Click "Claim" on any ticket. It will be assigned to you and set to "In Progress".' },
      { q: 'What tabs do I see on the Tickets page?', a: '• Assigned to Me — Tickets currently assigned to you.\n• My Requests — Tickets you raised yourself.' },
      { q: 'Can I change ticket status?', a: 'Yes, for tickets assigned to you:\n• Start Working — Move from Pending to In Progress.\n• Hold — Put the ticket on hold.\n• Resolve — Mark as Completed.' },
      { q: 'How do I raise my own ticket?', a: 'Click "New Ticket" → Your ticket type is automatically set to "Employee IT Issue" → Fill in the details and submit.' },
    ]
  },

  // ──────── CLIENT ────────
  {
    category: 'Client — Dashboard',
    icon: LayoutDashboard,
    color: '#94a3b8',
    roles: ['client'],
    items: [
      { q: 'What does my Dashboard show?', a: 'Your dashboard shows:\n• Stat cards — Total, Pending, In Progress, On Hold, and Completed ticket counts.\n• Priority chart — Visual breakdown of your tickets by priority.\n• Recent Tickets — Your latest 5 tickets with status and assigned agent.' },
    ]
  },
  {
    category: 'Client — Tickets',
    icon: Ticket,
    color: '#94a3b8',
    roles: ['client'],
    items: [
      { q: 'How do I raise a support ticket?', a: 'Click "New Ticket" → Your ticket type is automatically "Client Request" → Fill in subject, project, description, attach files if needed → Set priority → Submit.' },
      { q: 'How do I track my ticket?', a: 'Go to "My Tickets" in the sidebar → Click on any ticket to see its full details, status, SLA tracking, assigned agent, and comments.' },
      { q: 'Can I see other clients\' tickets?', a: 'No. Your data is completely private — you can only see tickets you created.' },

      { q: 'What are SLA times?', a: '• High Priority — Response: 2 hours, Resolution: 8 hours.\n• Medium Priority — Response: 8 hours, Resolution: 24 hours.\n• Low Priority — Response: 24 hours, Resolution: 72 hours.' },
    ]
  },

  // ──────── COMMON ────────
  {
    category: 'Notifications',
    icon: Bell,
    color: '#f59e0b',
    roles: ['admin', 'team_leader', 'hr', 'employee', 'client'],
    items: [
      { q: 'How do notifications work?', a: 'You receive real-time notifications with a sound alert when:\n• A new ticket is raised relevant to your role.\n• A ticket assigned to you is updated.\n• Someone comments on your ticket.\nNotifications appear as toast popups and are stored in the notification panel.' },
      { q: 'How do I view notifications?', a: 'Click the bell icon (🔔) in the top-right header. A panel slides open showing all your notifications with unread count.' },
      { q: 'How do I delete a notification?', a: 'Each notification has a trash icon on the right. Click it → A confirmation popup with Cancel and Delete buttons will appear.' },
      { q: 'How do I clear all notifications?', a: 'Click "Clear All" in the notification panel → Confirm in the popup to permanently remove all notifications.' },
    ]
  },
  {
    category: 'Tickets — General',
    icon: Ticket,
    color: '#10b981',
    roles: ['admin', 'team_leader', 'hr', 'employee', 'client'],
    items: [
      { q: 'What are ticket statuses?', a: '• Pending — Newly created, awaiting attention.\n• In Progress — Currently being worked on.\n• On Hold — Temporarily paused.\n• Completed — Issue resolved.' },
      { q: 'What are priority levels?', a: '• High — Critical/urgent (SLA: 2h response, 8h resolution).\n• Medium — Moderate disruption (SLA: 8h response, 24h resolution).\n• Low — No immediate impact (SLA: 24h response, 72h resolution).' },
      { q: 'How do I comment on a ticket?', a: 'Open any ticket → Scroll to "Activity & Comments" → Type your message and press Enter to send. Use Shift+Enter for a new line.' },
      { q: 'Can I attach files?', a: 'Yes! When creating a ticket, drag & drop or browse to upload PNG, JPG, PDF, or ZIP files (up to 10MB each).' },
    ]
  },
];

const Help = () => {
  const { user } = useContext(AuthContext);
  const [expanded, setExpanded] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const role = user?.role || 'client';

  const toggleExpand = (catIndex, itemIndex) => {
    const key = `${catIndex}-${itemIndex}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const roleFiltered = FAQ_DATA.filter(cat => cat.roles.includes(role));

  const searchedFAQ = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = roleFiltered.filter(cat => activeCategory === 'all' || cat.category === activeCategory);
    if (!q) return base;
    return base
      .map(cat => ({
        ...cat,
        items: cat.items.filter(it =>
          it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0);
  }, [roleFiltered, activeCategory, searchQuery]);

  const totalTopics = roleFiltered.reduce((sum, c) => sum + c.items.length, 0);

  const roleLabel = {
    admin: 'Admin', team_leader: 'Team Leader', hr: 'HR',
    employee: 'Employee', client: 'Client',
  }[role] || role;

  return (
    <div className="main-content animate-fade-in">
      {/* Page header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>
            Knowledge Base
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
            Guides and answers tailored for your <strong style={{ color: 'var(--primary)' }}>{roleLabel}</strong> role.
          </p>
        </div>
      </div>

      {/* Hero search card */}
      <div className="surface-card" style={{
        padding: '2rem 2.25rem',
        background: 'linear-gradient(135deg, var(--primary-soft) 0%, #f8fbff 100%)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -30, width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(73,190,255,0.18) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 24px rgba(93,135,255,0.3)',
            flexShrink: 0,
          }}>
            <BookOpen size={26} strokeWidth={2.4} />
          </div>
          <div style={{ flex: '1 1 280px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              How can we help you today?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
              Search through {totalTopics} articles, or pick a category below.
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', borderRadius: 'var(--radius)',
          padding: '0.7rem 1rem', marginTop: '1.25rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          maxWidth: 640, position: 'relative',
        }}>
          <Search size={18} color="var(--text-subtle)" />
          <input
            type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles, e.g. ‘assign a ticket’"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              color: 'var(--text-main)', fontSize: '0.9rem', padding: 0, margin: 0,
              boxShadow: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-subtle)', fontSize: 18, padding: 0,
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem', marginBottom: '1.75rem',
      }}>
        {[
          { label: 'Categories', value: `${roleFiltered.length}`, icon: LayoutDashboard, color: 'var(--primary)', bg: 'var(--primary-soft)' },
          { label: 'Articles', value: `${totalTopics}`, icon: BookOpen, color: 'var(--success)', bg: 'var(--success-soft)' },
          { label: 'Your role', value: roleLabel, icon: Award, color: 'var(--warning)', bg: 'var(--warning-soft)' },
          { label: 'Need more?', value: 'Contact us', icon: MessageCircle, color: 'var(--info)', bg: 'var(--info-soft)' },
        ].map((s, i) => (
          <div key={i} className="surface-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: s.bg, color: s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <s.icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: 2 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category chips + content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 240px) minmax(0, 1fr)',
        gap: '1.5rem',
      }} className="kb-grid">
        {/* Sidebar of categories */}
        <aside className="surface-card" style={{ padding: '0.75rem', alignSelf: 'flex-start', position: 'sticky', top: 88 }}>
          <div className="nav-section-label" style={{ padding: '0.5rem 0.75rem 0.4rem' }}>Categories</div>
          <button
            onClick={() => setActiveCategory('all')}
            style={catChipStyle(activeCategory === 'all', 'var(--primary)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={15} /> All Topics
            </span>
            <span style={countPillStyle(activeCategory === 'all')}>{totalTopics}</span>
          </button>
          {roleFiltered.map(cat => {
            const active = activeCategory === cat.category;
            const Icon = cat.icon;
            return (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                style={catChipStyle(active, cat.color)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Icon size={15} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</span>
                </span>
                <span style={countPillStyle(active)}>{cat.items.length}</span>
              </button>
            );
          })}
        </aside>

        {/* Articles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {searchedFAQ.length === 0 ? (
            <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
              <HelpCircle size={42} style={{ opacity: 0.25, marginBottom: '0.85rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-heading)' }}>No articles match your search.</p>
              <p style={{ fontSize: '0.88rem', marginTop: 4 }}>Try a different keyword or browse all topics.</p>
              <button
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="btn btn-secondary"
                style={{ marginTop: '1.25rem' }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            searchedFAQ.map((cat, cIdx) => {
              const Icon = cat.icon;
              return (
                <div key={cat.category} className="surface-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    padding: '1.1rem 1.5rem',
                    background: `linear-gradient(90deg, ${cat.color}10, transparent)`,
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: cat.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 6px 14px ${cat.color}40`,
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)' }}>{cat.category}</h3>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{cat.items.length} article{cat.items.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>

                  <div>
                    {cat.items.map((item, iIdx) => {
                      const key = `${cIdx}-${iIdx}`;
                      const isExp = expanded[key];
                      return (
                        <div
                          key={iIdx}
                          onClick={() => toggleExpand(cIdx, iIdx)}
                          style={{
                            cursor: 'pointer',
                            borderBottom: iIdx < cat.items.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.2s ease',
                            background: isExp ? 'var(--bg-muted)' : 'transparent',
                          }}
                          onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'var(--bg-muted)'; }}
                          onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem 1.5rem', gap: '1rem',
                          }}>
                            <h4 style={{
                              fontSize: '0.92rem',
                              fontWeight: isExp ? 700 : 600,
                              color: isExp ? cat.color : 'var(--text-heading)',
                              transition: 'color 0.2s', flex: 1,
                            }}>{item.q}</h4>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: isExp ? cat.color : 'var(--bg-card)',
                              border: `1px solid ${isExp ? cat.color : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s', flexShrink: 0,
                            }}>
                              {isExp
                                ? <ChevronUp size={15} color="#fff" />
                                : <ChevronDown size={15} color="var(--text-muted)" />}
                            </div>
                          </div>
                          <div style={{
                            maxHeight: isExp ? '600px' : '0',
                            opacity: isExp ? 1 : 0,
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              padding: '0 1.5rem 1.25rem',
                              color: 'var(--text-muted)',
                              lineHeight: 1.7,
                              fontSize: '0.88rem',
                              whiteSpace: 'pre-line',
                            }}>
                              {item.a}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Contact callout */}
          <div className="surface-card" style={{
            padding: '1.75rem',
            background: 'linear-gradient(135deg, #2a3547 0%, #1c2434 100%)',
            color: '#fff', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Still need help?</h4>
                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 2 }}>Drop us a line — our support team responds quickly.</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = 'mailto:support@helpdesk.com'}
              className="btn"
              style={{
                background: '#fff', color: 'var(--text-heading)',
                padding: '0.7rem 1.4rem', borderRadius: '999px', fontWeight: 700,
              }}
            >
              Contact Support <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .kb-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const catChipStyle = (active, color) => ({
  width: '100%',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: 10, padding: '0.6rem 0.8rem',
  borderRadius: 'var(--radius)',
  border: 'none', cursor: 'pointer',
  background: active ? color : 'transparent',
  color: active ? '#fff' : 'var(--text-main)',
  fontSize: '0.83rem', fontWeight: 600, textAlign: 'left',
  marginBottom: 4, transition: 'all 0.18s ease',
  boxShadow: active ? `0 4px 12px ${color}40` : 'none',
});

const countPillStyle = (active) => ({
  fontSize: '0.7rem', fontWeight: 700,
  background: active ? 'rgba(255,255,255,0.22)' : 'var(--bg-muted)',
  color: active ? '#fff' : 'var(--text-muted)',
  padding: '2px 8px', borderRadius: 999,
});

export default Help;
