import API_BASE_URL from '../../config';
import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Upload, X, FileText, AlertTriangle,
  Globe, User as UserIcon, ShieldCheck, Award,
  Save, Sparkles, ChevronDown
} from 'lucide-react';

const TICKET_TYPE_MAP = {
  hr: { value: 'hr', label: 'HR Request', icon: ShieldCheck, color: '#fb7185' },
  team_leader: { value: 'team_leader', label: 'Team Leader', icon: Award, color: '#c084fc' },
  bug: { value: 'bug', label: 'Bug Report', icon: AlertTriangle, color: '#ef4444' },
};

const CATEGORIES_BY_TYPE = {
  hr: [
    'Leave Application', 'Payroll / Salary', 'Policy Query',
    'Recruitment / Hiring', 'Onboarding', 'Documents / Letters',
    'Desk / Facility Issue', 'Employee Grievance',
    'Hardware Issue', 'Software Installation', 'Network / Wi-Fi',
    'Password Reset', 'Email Config', 'System Slowdown', 'Printer Issue',
    'Other'
  ],
  team_leader: [
    'Team Coordination', 'Resource Request', 'Project Escalation',
    'Policy Implementation', 'Training Request', 'Other'
  ],
  bug: [
    'UI/UX Issue', 'Functionality Broken', 'Performance Issue', 'Security Vulnerability', 'Other'
  ]
};

const NewTicketDrawer = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const isTeamLeader = user?.role === 'team_leader';
  const isManagement = isAdmin || isTeamLeader;

  const defaultType = user?.role === 'client' ? 'bug' : 'hr';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: defaultType,
    priority: 'low',
    category: '',
    otherCategory: '',
    project: '',
    assignedTo: '',
  });

  const [projects, setProjects] = useState([]);
  const [agents, setAgents] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetch(`${API_BASE_URL}/api/projects`, { headers: { 'Authorization': `Bearer ${user.token}` } })
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : []));

    if (isManagement) {
      const endpoint = user.role === 'team_leader' ? '/api/users/employees' : '/api/users/agents';
      fetch(`${API_BASE_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(res => res.json())
        .then(data => setAgents(Array.isArray(data) ? data : []));
    }
  }, [isOpen, user.token, user.role, isManagement]);

  const handleFileChange = (newFiles) => {
    const list = Array.from(newFiles);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...list.filter(f => !existing.has(f.name))];
    });
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const newFile = new File([file], `pasted-image-${Date.now()}.png`, { type: file.type });
          handleFileChange([newFile]);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    
    // Process category if "Other"
    const finalCategory = formData.category === 'Other' ? (formData.otherCategory || 'Other') : formData.category;
    
    Object.entries(formData).forEach(([k, v]) => { 
      if (k === 'category') {
        data.append(k, finalCategory);
      } else if (k !== 'otherCategory' && v) {
        data.append(k, v); 
      }
    });
    
    files.forEach(f => data.append('files', f));

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: data
      });
      if (res.ok) {
        onSuccess?.();
        onClose();
        setFormData({ title: '', description: '', type: defaultType, priority: 'low', category: '', otherCategory: '', project: '', assignedTo: '' });
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };

  const inputStyle = {
    width: '100%', padding: '0.85rem 1.1rem',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: '12px', color: 'var(--text-main)',
    fontSize: '0.9rem', outline: 'none', marginBottom: 0,
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div
        onClick={onClose}
        style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(2, 6, 13, 0.6)', zIndex: 1100, backdropFilter: 'blur(8px)',
          opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s ease'
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '540px', height: '100%',
        background: 'var(--bg-dark)', borderLeft: '1px solid var(--border)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6)', zIndex: 1101,
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Fixed Header */}
        <div style={{
          padding: '1.5rem 2rem',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(99,102,241,0.15)' }}>
                <Sparkles size={16} color="#818cf8" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Create New Ticket</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submit a new support request to the team.</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--glass)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Subject */}
            <div>
              <label style={labelStyle}>Subject *</label>
              <input
                type="text" placeholder="Brief summary of the issue" required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Ticket Type */}
            <div>
              <label style={labelStyle}>Ticket Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {(isManagement ? [
                  { value: 'hr', label: 'HR Request' },
                  { value: 'team_leader', label: 'Team Leader' },
                  { value: 'bug', label: 'Bug Report' }
                ] : user.role === 'client' ? [
                  { value: 'bug', label: 'Bug Report' }
                ] : [
                  { value: 'hr', label: 'HR Request' },
                  { value: 'bug', label: 'Bug Report' }
                ]).map(type => {
                  const cfg = TICKET_TYPE_MAP[type.value];
                  const Icon = cfg.icon;
                  const isActive = formData.type === type.value;
                  return (
                    <button
                      key={type.value} type="button"
                      onClick={() => setFormData({ ...formData, type: type.value, assignedTo: '', category: '', otherCategory: '' })}
                      style={{
                        padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: isActive ? `${cfg.color}15` : 'var(--glass)',
                        border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: isActive ? cfg.color : 'var(--glass)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={14} color={isActive ? '#fff' : 'var(--text-muted)'} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project */}
            {(formData.type === 'bug' || formData.type === 'team_leader') && (
              <div>
                <label style={labelStyle}>Select Project</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.project}
                    onChange={e => setFormData({ ...formData, project: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="">Internal / No Project</option>
                    {projects
                      .filter(p => user.role !== 'client' || (p.client?._id || p.client) === user._id)
                      .map(p => <option key={p._id} value={p.name}>{p.name} {p.teamName ? `(${p.teamName})` : ''}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5, pointerEvents: 'none' }} />
                </div>
                {formData.project && projects.find(p => p.name === formData.project) && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {projects.find(p => p.name === formData.project).teamName && (
                      <span style={{ fontSize: '0.7rem', color: '#c084fc', fontWeight: '700', marginRight: '0.5rem' }}>👥 {projects.find(p => p.name === formData.project).teamName}</span>
                    )}
                    {projects.find(p => p.name === formData.project).projectUrl && (
                      <a href={projects.find(p => p.name === formData.project).projectUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none' }}>🌐 Project</a>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="">Select Category</option>
                    {(CATEGORIES_BY_TYPE[formData.type] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5, pointerEvents: 'none' }} />
                </div>
              </div>

              {formData.category === 'Other' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Issue Details / Custom Category *</label>
                  <textarea
                    rows="3"
                    placeholder="Describe your custom issue or specify category details..." 
                    required
                    value={formData.otherCategory}
                    onChange={e => setFormData({ ...formData, otherCategory: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              )}

              {/* Priority */}
              <div>
                <label style={labelStyle}>Priority</label>
                <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '12px', padding: '0.3rem', border: '1px solid var(--border)' }}>
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      style={{
                        flex: 1, padding: '0.6rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: '700', textTransform: 'capitalize',
                        background: formData.priority === p
                          ? (p === 'high' ? 'var(--danger)' : p === 'medium' ? 'var(--warning)' : 'var(--success)')
                          : 'transparent',
                        color: formData.priority === p ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Assignee / Target */}
            {isManagement && formData.type !== 'bug' && (
              <div>
                <label style={labelStyle}>Assign Solver</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.assignedTo}
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="">Keep Unassigned</option>
                    {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role.replace('_', ' ')})</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5, pointerEvents: 'none' }} />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
                <textarea
                  rows="6"
                  placeholder={`Describe the issue in detail.\n\n• What happened?\n• When did it start?\n• Steps to reproduce (if applicable)`}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  onPaste={handlePaste}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
            </div>

            {/* Attachments */}
            <div>
              <label style={labelStyle}>Attachments</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files); }}
                  onPaste={handlePaste}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '16px', padding: '1.5rem', textAlign: 'center',
                    background: dragOver ? 'rgba(99,102,241,0.05)' : 'var(--glass)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => document.getElementById('drawer-file-upload').click()}
                >
                  <Upload size={20} color="var(--text-muted)" style={{ marginBottom: '0.4rem' }} />
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)' }}>Click or Drag</p>
                  <input
                    id="drawer-file-upload" type="file" multiple hidden
                    onChange={e => handleFileChange(e.target.files)}
                  />
                </div>

                <div
                  onPaste={handlePaste}
                  tabIndex="0"
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '16px', padding: '1.5rem', textAlign: 'center',
                    background: 'var(--glass)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    outline: 'none'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ 
                    width: '28px', height: '28px', borderRadius: '50%', 
                    background: 'rgba(99,102,241,0.1)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' 
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                  </div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)' }}>Paste Here</p>
                </div>
              </div>
              {files.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {files.map(f => (
                    <div key={f.name} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 0.8rem', background: 'var(--glass)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px', fontSize: '0.8rem'
                    }}>
                      <FileText size={14} color="#818cf8" />
                      <span style={{ flex: 1, color: 'var(--text-main)' }}>{f.name}</span>
                      <button type="button" onClick={() => removeFile(f.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div style={{
              display: 'flex', gap: '1rem', paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
              position: 'sticky', bottom: 0, background: 'var(--bg-dark)',
              zIndex: 10, paddingBottom: '0.5rem'
            }}>
              <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, height: '44px', justifyContent: 'center', borderRadius: '10px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, height: '44px', justifyContent: 'center', borderRadius: '10px', gap: '0.5rem' }}>
                {loading ? 'Processing...' : <><Save size={18} /> Create Ticket</>}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        select option { background: var(--bg-input); color: var(--text-main); }
      `}</style>
    </>,
    document.body
  );
};

export default NewTicketDrawer;
