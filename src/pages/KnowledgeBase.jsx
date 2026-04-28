import React, { useState, useContext } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Shield, Users, Ticket, Bell, LayoutDashboard, ShieldCheck, UserCheck, Globe, Award, HelpCircle, Star, FolderOpen, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Each FAQ item has a 'roles' array — only shown to those roles
const FAQ_DATA = [
  {
    category: 'Getting Started',
    icon: HelpCircle,
    color: '#6366f1',
    roles: ['admin', 'team_leader', 'hr', 'employee', 'client'],
    items: [
      { q: 'What is the Unified Helpdesk Portal?', a: 'This is a centralized ticketing and support system where you can raise, track, and resolve issues. Each user has a role-based view tailored to their responsibilities.' },
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
      { q: 'How do I create a project?', a: 'Go to "Projects" → Enter project name, description, assign a Team Leader → Click "Create Project". All tickets can be linked to a project.' },
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
      { q: 'How do I rate my support experience?', a: 'Once your ticket is marked "Completed", a star rating section appears on the ticket detail page. Click 1-5 stars, optionally add feedback, and submit.' },
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
  const [searchQuery, setSearchQuery] = useState('');

  const role = user?.role || 'client';

  const toggleExpand = (catIndex, itemIndex) => {
    const key = `${catIndex}-${itemIndex}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter by role first, then by search
  const roleFiltered = FAQ_DATA.filter(cat => cat.roles.includes(role));

  const filteredFAQ = roleFiltered.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    })
  })).filter(cat => cat.items.length > 0);

  const totalTopics = roleFiltered.reduce((sum, c) => sum + c.items.length, 0);

  const roleLabel = {
    admin: 'Admin',
    team_leader: 'Team Leader',
    hr: 'HR',
    employee: 'Employee',
    client: 'Client'
  }[role] || role;

  const roleColor = {
    admin: '#a5b4fc',
    team_leader: '#c084fc',
    hr: '#fb7185',
    employee: '#6ee7b7',
    client: '#94a3b8'
  }[role] || '#6366f1';

  return (
    <div className="main-content animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BookOpen color="var(--primary)" /> Help Center
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Help guide tailored for your <span style={{ color: roleColor, fontWeight: '600' }}>{roleLabel}</span> role.
            </p>
          </div>
          <div style={{
            padding: '0.45rem 1rem', borderRadius: '999px',
            background: `${roleColor}18`, border: `1px solid ${roleColor}40`,
            fontSize: '0.78rem', fontWeight: '700', color: roleColor,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: roleColor }} />
            {roleLabel} Guide
          </div>
        </div>
      </header>

      {/* Search */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder={`Search help topics for ${roleLabel}...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '1rem', fontSize: '0.95rem', width: '100%' }}
        />
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Help Topics', value: totalTopics, color: roleColor },
          { label: 'Categories', value: roleFiltered.length, color: '#10b981' },
          { label: 'Your Role', value: roleLabel, color: roleColor },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: `3px solid ${stat.color}` }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {filteredFAQ.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <HelpCircle size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: '500' }}>No results found for "{searchQuery}"</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Try different keywords or clear the search.</p>
          </div>
        ) : (
          filteredFAQ.map((cat, cIdx) => {
            const Icon = cat.icon;
            return (
              <div key={cIdx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={18} color={cat.color} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>{cat.category}</h2>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cat.items.length} topic{cat.items.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {cat.items.map((item, iIdx) => {
                    const key = `${cIdx}-${iIdx}`;
                    const isExp = expanded[key];
                    return (
                      <div 
                        key={iIdx} 
                        className="glass-card" 
                        style={{ 
                          padding: '1rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s',
                          borderLeft: isExp ? `3px solid ${cat.color}` : '3px solid transparent'
                        }}
                        onClick={() => toggleExpand(cIdx, iIdx)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: '500', color: isExp ? cat.color : 'var(--text-main)' }}>{item.q}</h3>
                          {isExp ? <ChevronUp size={18} color={cat.color} /> : <ChevronDown size={18} color="var(--text-muted)" />}
                        </div>
                        {isExp && (
                          <div style={{ 
                            marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', 
                            color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.9rem',
                            whiteSpace: 'pre-line'
                          }}>
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Help;
