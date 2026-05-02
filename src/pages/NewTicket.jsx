import API_BASE_URL from '../config';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Upload, X, FileText, AlertTriangle } from 'lucide-react';

const TICKET_TYPE_MAP = {
  employee: { value: 'employee', label: 'Employee IT Issue', desc: 'Internal system or software problem' },
  hr: { value: 'hr', label: 'HR Request', desc: 'Internal HR or administrative request' },
  team_leader: { value: 'team_leader', label: 'Team Leader Request', desc: 'Management or high-level coordination issue' },
};

const BUG_TYPE_TILE = { value: 'bug', label: 'Bug Report', desc: 'Earn points by reporting verified bugs' };

const CATEGORIES_BY_TYPE = {
  employee: [
    'Hardware Issue', 'Software Installation', 'Network / Wi-Fi',
    'Password Reset', 'Email Config', 'System Slowdown', 'Printer Issue', 'Other'
  ],
  hr: [
    'Leave Application', 'Payroll / Salary', 'Policy Query',
    'Recruitment / Hiring', 'Onboarding', 'Documents / Letters',
    'Desk / Facility Issue', 'Employee Grievance', 'Other'
  ],
  team_leader: [
    'Team Coordination', 'Resource Request', 'Project Escalation',
    'Policy Implementation', 'Training Request', 'Other'
  ],
  bug: [
    'UI Bug', 'Functional Bug', 'Performance', 'Security',
    'Data Integrity', 'Crash / Error', 'Compatibility', 'Other'
  ]
};

const NewTicket = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';
  const isTeamLeader = user.role === 'team_leader';
  const isManagement = isAdmin || isTeamLeader;

  const defaultType = user.role === 'client' ? 'bug' : (TICKET_TYPE_MAP[user.role]?.value || 'hr');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/projects`, { headers: { 'Authorization': `Bearer ${user.token}` } })
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : []));

    if (user.role === 'admin' || user.role === 'team_leader') {
      fetch(`${API_BASE_URL}/api/users/agents`, { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(res => res.json())
        .then(data => setAgents(Array.isArray(data) ? data : []));
    }
  }, [user.token, user.role]);

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
  const [agents, setAgents] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    Object.entries(formData).forEach(([k, v]) => { 
      if (k === 'category' && v === 'Other') {
        data.append(k, formData.otherCategory || 'Other');
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
      if (res.ok) navigate('/tickets');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', desc: 'No immediate impact', color: 'var(--success)' },
    { value: 'medium', label: 'Medium', desc: 'Moderate disruption', color: 'var(--warning)' },
    { value: 'high', label: 'High', desc: 'Critical / urgent', color: 'var(--danger)' },
  ];

  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' };

  return (
    <div className="main-content animate-fade-in">
      <button onClick={() => navigate('/tickets')} className="btn btn-outline" style={{ marginBottom: '1.75rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Submit a Ticket</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {user.role === 'employee' || user.role === 'team_leader'
            ? 'Raise an internal IT support request.'
            : 'Submit an internal issue or request.'}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1.25rem', fontSize: '0.95rem', color: 'var(--text-main)' }}>Ticket Details</h3>

            <label style={labelStyle}>Subject *</label>
            <input
              type="text" placeholder="Brief summary of the issue" required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />

            <label style={labelStyle}>Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select a category (optional)</option>
              {(CATEGORIES_BY_TYPE[formData.type] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {formData.category === 'Other' && (
              <>
                <label style={labelStyle}>Issue Details / Custom Category *</label>
                <textarea
                  rows="3"
                  placeholder="Describe your custom issue or specify category details..." 
                  required
                  value={formData.otherCategory || ''}
                  onChange={e => setFormData({ ...formData, otherCategory: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </>
            )}


            {(formData.type === 'bug' || !['employee', 'hr'].includes(user.role)) && (
              <>
                <label style={labelStyle}>Project {(formData.type === 'bug' || user.role !== 'hr') && '*'}</label>
                <select
                  required={formData.type === 'bug' || user.role !== 'hr'}
                  value={formData.project}
                  onChange={e => setFormData({ ...formData, project: e.target.value })}
                >
                  <option value="">Select a project</option>
                  {projects
                    .filter(p => user.role !== 'client' || (p.client?._id || p.client) === user._id)
                    .map(p => (
                    <option key={p._id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </>
            )}


            <label style={labelStyle}>Description</label>
            <textarea
              rows="6"
              placeholder={`Describe the issue in detail.\n\n• What happened?\n• When did it start?\n• Steps to reproduce (if applicable)`}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              onPaste={handlePaste}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            {(user.role === 'admin' || user.role === 'team_leader') && formData.type === 'employee' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Assign Employee (Solver)</label>
                <select
                  value={formData.assignedTo}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {agents
                    .filter(a => user.role !== 'team_leader' || a.role === 'employee')
                    .map(a => <option key={a._id} value={a._id}>{a.name} ({a.role.replace('_', ' ')})</option>)}
                </select>
              </div>
            )}

            {(user.role === 'admin' || user.role === 'team_leader') && formData.type === 'hr' && (
              <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>For Employee</label>
                  <select
                    value={formData.assignedTo} // Reusing assignedTo for HR solver if needed or just simplify
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {agents.filter(a => a.role === 'employee').map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>
                {user.role === 'admin' && (
                  <div>
                    <label style={labelStyle}>Assign HR (Solver)</label>
                    <select
                      value={formData.assignedTo}
                      onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {agents
                        .filter(a => a.role === 'hr' || a.role === 'admin')
                        .map(a => <option key={a._id} value={a._id}>{a.name} ({a.role.replace('_', ' ')})</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
            <h3 style={{ fontWeight: '600', marginBottom: '1.25rem', fontSize: '0.95rem', color: 'var(--text-main)' }}>Attachments</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files); }}
                onPaste={handlePaste}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
                  background: dragOver ? 'rgba(99,102,241,0.05)' : 'var(--glass)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>Click or Drag Files</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Support for JPG, PNG, PDF</p>
                <input
                  id="file-upload" type="file" multiple hidden
                  onChange={e => handleFileChange(e.target.files)}
                />
              </div>

              {/* Paste Zone */}
              <div
                onPaste={handlePaste}
                tabIndex="0"
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
                  background: 'var(--glass)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  outline: 'none'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  background: 'rgba(99,102,241,0.1)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' 
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>Paste Screenshot</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ctrl + V to attach</p>
              </div>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {files.map(f => (
                  <div key={f.name} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.9rem', background: 'var(--glass)', borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <FileText size={15} color="var(--primary)" />
                    <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>{f.name}</span>
                    <button type="button" onClick={() => removeFile(f.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate('/tickets')} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '140px', justifyContent: 'center' }}>
              {loading ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>

        {/* Right Sidebar — Priority + Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Ticket Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(isManagement ? [
                { value: 'employee', label: 'For IT Support', desc: 'Internal IT/System issue' },
                { value: 'hr', label: 'For HR', desc: 'Internal HR/Admin request' },
                { value: 'team_leader', label: 'For Team Leader', desc: 'Management coordination' },
                BUG_TYPE_TILE
              ] : user.role === 'hr' ? [
                { value: 'hr', label: 'HR Issue', desc: 'Sent to Admin for resolution' },
                { value: 'employee', label: 'For Employee', desc: 'Suggest to an employee' },
                BUG_TYPE_TILE
              ] : user.role === 'employee' ? [
                { value: 'employee', label: 'IT Issue', desc: 'Internal system or software problem' },
                BUG_TYPE_TILE
              ] : user.role === 'client' ? [
                BUG_TYPE_TILE
              ] : [
                { value: (TICKET_TYPE_MAP[user.role]?.value || 'hr'), ...(TICKET_TYPE_MAP[user.role] || { label: 'Request', desc: 'Submit a request' }) }
              ]).map(type => (
                <button
                  key={type.value} type="button"
                  onClick={() => setFormData({ ...formData, type: type.value, assignedTo: '' })}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                    background: formData.type === type.value ? 'rgba(99,102,241,0.12)' : 'var(--glass)',
                    border: `1px solid ${formData.type === type.value ? 'var(--primary)' : 'var(--border)'}`,
                    textAlign: 'left', transition: 'all 0.2s ease'
                  }}
                >
                  <p style={{ fontWeight: '600', fontSize: '0.85rem', color: formData.type === type.value ? 'var(--primary)' : 'var(--text-main)' }}>{type.label}</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Priority Level</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {priorityOptions.map(opt => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setFormData({ ...formData, priority: opt.value })}
                  style={{
                    padding: '0.7rem 1rem', borderRadius: '8px', cursor: 'pointer',
                    background: formData.priority === opt.value ? `${opt.color}18` : 'var(--glass)',
                    border: `1px solid ${formData.priority === opt.value ? opt.color : 'var(--border)'}`,
                    color: formData.priority === opt.value ? opt.color : 'var(--text-muted)',
                    textAlign: 'left', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.85rem', color: formData.priority === opt.value ? opt.color : 'var(--text-main)' }}>{opt.label}</p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--glass)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={15} color="var(--warning)" />
              <h3 style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--warning)' }}>SLA Protocols</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--danger)' }}>🔴 High</span>
                <span>2h Response</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--warning)' }}>🟡 Medium</span>
                <span>8h Response</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--success)' }}>🟢 Low</span>
                <span>24h Response</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTicket;
