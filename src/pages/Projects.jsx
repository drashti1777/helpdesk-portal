import React, { useEffect, useState, useContext, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../config';
import {
  Plus, Search, Briefcase, Users, Mail, Phone, Trash2, Edit2,
  RefreshCw, X, PlusCircle, ExternalLink, Globe, Layout,
  User as UserIcon, Shield, AlertCircle, CheckCircle2, Bug,
  FileText, Upload
} from 'lucide-react';
import ConfirmModal from '../components/Layout/ConfirmModal';

const Projects = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, projectId: null });
  const [editingProject, setEditingProject] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamName: '',
    productionUrl: '',
    uatUrl: '',
    productionLink: '',
    teamLeader: '',
    teamMembers: [],
    status: 1
  });
  const [infoProject, setInfoProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [expandedDescId, setExpandedDescId] = useState(null);
  const [bugStats, setBugStats] = useState({});
  const [knowledgeBaseFile, setKnowledgeBaseFile] = useState(null);
  const [isDraggingKnowledgeBase, setIsDraggingKnowledgeBase] = useState(false);
  const knowledgeBaseInputRef = useRef(null);

  const getKnowledgeBaseUrl = (project) =>
    project?.knowledgeBase ? `${API_BASE_URL}${project.knowledgeBase}` : '';

  const handleKnowledgeBaseSelect = (files) => {
    const [file] = Array.from(files || []);
    if (!file) return;
    setKnowledgeBaseFile(file);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch projects failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (user.role !== 'admin' && user.role !== 'team_leader') return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/agents`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setAvailableUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch users failed:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [user.token]);

  useEffect(() => {
    if (!projects.length) return;
    let cancelled = false;
    (async () => {
      const results = {};
      await Promise.all(projects.map(async (p) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/projects/${p._id}/bug-stats`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          if (res.ok) {
            results[p._id] = await res.json();
          }
        } catch (_) { /* ignore */ }
      }));
      if (!cancelled) setBugStats(results);
    })();
    return () => { cancelled = true; };
  }, [projects, user.token]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = editingProject ? 'PUT' : 'POST';
    const url = editingProject 
      ? `${API_BASE_URL}/api/projects/${editingProject._id}`
      : `${API_BASE_URL}/api/projects`;

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('teamName', formData.teamName);
      payload.append('productionUrl', formData.productionUrl);
      payload.append('uatUrl', formData.uatUrl);
      payload.append('productionLink', formData.productionLink);
      payload.append('teamLeader', formData.teamLeader);
      payload.append('teamMembers', JSON.stringify(formData.teamMembers));
      payload.append('status', formData.status);
      if (knowledgeBaseFile) {
        payload.append('knowledgeBaseFile', knowledgeBaseFile);
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: payload
      });
      if (res.ok) {
        showToast(`Project ${editingProject ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchProjects();
        resetForm();
      } else {
        const err = await res.json();
        showToast(err.message || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      teamName: '',
      productionUrl: '',
      uatUrl: '',
      productionLink: '',
      teamLeader: '',
      teamMembers: [],
      status: 1
    });
    setKnowledgeBaseFile(null);
    setShowMemberDropdown(false);
    setMemberSearch('');
    setEditingProject(null);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      teamName: project.teamName || '',
      productionUrl: project.productionUrl || '',
      uatUrl: project.uatUrl || '',
      productionLink: project.productionLink || '',
      teamLeader: project.teamLeader?._id || project.teamLeader || '',
      teamMembers: (project.teamMembers || []).map(m => m._id || m),
      status: project.status ?? 1
    });
    setKnowledgeBaseFile(null);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, projectId: id });
  };

  const executeDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${deleteConfirm.projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        showToast('Project deleted successfully');
        fetchProjects();
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, projectId: null });
    }
  };

  const handleMemberToggle = (userId) => {
    setFormData(prev => {
      const isMember = prev.teamMembers.includes(userId);
      return {
        ...prev,
        teamMembers: isMember 
          ? prev.teamMembers.filter(id => id !== userId)
          : [...prev.teamMembers, userId]
      };
    });
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.teamName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content">
      <div className="animate-fade-in">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Project Management</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Full visibility and oversight of all registered projects.</p>
          </div>
          {user.role === 'admin' && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
              <PlusCircle size={18} /> New Project
            </button>
          )}
        </header>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', maxWidth: '2000px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by project or team name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
            />
          </div>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 210px 150px 1fr 120px 120px 120px 90px',
            padding: '0.75rem 1.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.7rem',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em'
          }}>
            <span>Project & Status</span>
            <span>Project Leader</span>
            <span>Access Links</span>
            <span>Description</span>
            <span>KBase</span>
            <span>Team Info</span>
            <span>Bugs</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Briefcase size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No projects matched your criteria.</p>
            </div>
          ) : (
            filteredProjects.map((project, idx) => (
              <div key={project._id} style={{
                display: 'grid',
                gridTemplateColumns: '180px 210px 150px 1fr 120px 120px 120px 90px',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: idx < filteredProjects.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.2s ease'
              }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {/* 1. Project & Team Name */}
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>{project.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                        background: project.status === 1 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: project.status === 1 ? '#22c55e' : '#ef4444',
                        fontWeight: '700', border: `1px solid ${project.status === 1 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        cursor: (user.role === 'admin' || (user.role === 'team_leader' && (project.teamLeader?._id || project.teamLeader) === user._id)) ? 'pointer' : 'default'
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (user.role !== 'admin' && (user.role !== 'team_leader' || (project.teamLeader?._id || project.teamLeader) !== user._id)) return;
                        const newStatus = project.status === 1 ? 0 : 1;
                        const res = await fetch(`${API_BASE_URL}/api/projects/${project._id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                          body: JSON.stringify({ ...project, status: newStatus, teamLeader: project.teamLeader?._id || project.teamLeader })
                        });
                        if (res.ok) fetchProjects();
                      }}
                      title="Click to toggle status"
                      >
                        {project.status === 1 ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    {project.teamName && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                        {project.teamName}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                     #{project._id.slice(-6).toUpperCase()}
                  </p>
                </div>

                {/* 2. Leader Details */}
                <div>
                  {project.teamLeader ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <UserIcon size={13} color="var(--primary)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          {project.teamLeader.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        <Mail size={12} /> {project.teamLeader.email}
                      </div>
                      {project.teamLeader.mobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          <Phone size={12} /> {project.teamLeader.mobile}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </div>

                {/* 3. Access Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {project.productionUrl && (
                    <a href={project.productionUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
                      <Globe size={13} /> Production
                    </a>
                  )}
                  {project.uatUrl && (
                    <a href={project.uatUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#f59e0b', textDecoration: 'none', fontWeight: '600' }}>
                      <Shield size={13} /> UAT Link
                    </a>
                  )}
                  {project.productionLink && (
                    <a href={project.productionLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>
                      <Layout size={13} /> Dashboard
                    </a>
                  )}
                  {!project.productionUrl && !project.uatUrl && !project.productionLink && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                  )}
                </div>

                {/* 4. Description */}
                <div>
                  <p style={{ 
                    fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', 
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {project.description || 'No description'}
                  </p>
                </div>

                {/* 5. Knowledge Base */}
                <div>
                  {project.knowledgeBase ? (
                    <button
                      type="button"
                      onClick={() => window.open(getKnowledgeBaseUrl(project), '_blank', 'noopener,noreferrer')}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <FileText size={12} />
                      <span>View</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No KB</span>
                  )}
                </div>

                {/* 5. Info */}
                <div>
                  <button 
                    onClick={() => setInfoProject(project)}
                    className="btn btn-outline" 
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Users size={12} />
                    <span>{project.teamMembers?.length || 0} Members</span>
                  </button>
                </div>

                {/* 6. Bug Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(() => {
                    const s = bugStats[project._id];
                    if (!s) {
                      return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.5 }}>—</span>;
                    }
                    if (s.total === 0) {
                      return (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Bug size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: '-2px' }} />
                          No bugs
                        </span>
                      );
                    }
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Bug size={12} color="#ef4444" />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{s.total} total</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>{s.open} open</span>
                          <span> · </span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{s.completed} fixed</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {(user.role === 'admin' || (user.role === 'team_leader' && (project.teamLeader?._id || project.teamLeader) === user._id)) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(project)} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '8px' }}>
                      <Edit2 size={16} />
                    </button>
                    {user.role === 'admin' && (
                      <button onClick={() => handleDelete(project._id)} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999,
          background: toast.type === 'error' ? 'rgba(254, 226, 226, 0.98)' : 'rgba(220, 252, 231, 0.98)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`,
          color: '#000', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: '600',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'slideInRight 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Register Project Drawer - Rendered via Portal to avoid clipping */}
      {ReactDOM.createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'flex-end', zIndex: 99999,
          opacity: showModal ? 1 : 0, pointerEvents: showModal ? 'all' : 'none',
          transition: 'opacity 0.3s ease'
        }} onClick={() => setShowModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-dark)', borderLeft: '1px solid var(--border)',
              width: '100%', maxWidth: '550px', height: '100%',
              boxShadow: '-10px 0 50px rgba(0,0,0,0.5)', position: 'relative',
              display: 'flex', flexDirection: 'column',
              transform: showModal ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                  {editingProject ? 'Update Project' : 'Register Project'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configure project details and team assignments.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '10px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              <form onSubmit={handleSubmit} id="project-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Project Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. HelpDesk Portal" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Team Name</label>
                  <input type="text" value={formData.teamName} onChange={e => setFormData({ ...formData, teamName: e.target.value })} placeholder="e.g. Alpha Developers" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Description / Credentials</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Enter project details, credentials, or brief description..."
                    style={{ minHeight: '100px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Production URL</label>
                    <input type="url" value={formData.productionUrl} onChange={e => setFormData({ ...formData, productionUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>UAT URL</label>
                    <input type="url" value={formData.uatUrl} onChange={e => setFormData({ ...formData, uatUrl: e.target.value })} placeholder="https://..." />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Dashboard Link</label>
                    <input type="url" value={formData.productionLink} onChange={e => setFormData({ ...formData, productionLink: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Project Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: Number(e.target.value) })}>
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Team Leader</label>
                  <select value={formData.teamLeader} onChange={e => setFormData({ ...formData, teamLeader: e.target.value })}>
                    <option value="">Select Team Leader</option>
                    {availableUsers.filter(u => u.role === 'team_leader').map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                    <option value="" disabled>--- Other Staff ---</option>
                    {availableUsers.filter(u => u.role !== 'team_leader').map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  {/* Show selected leader details */}
                  {formData.teamLeader && (() => {
                    const leader = availableUsers.find(u => u._id === formData.teamLeader);
                    if (!leader) return null;
                    return (
                      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '-0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UserIcon size={14} color="var(--primary)" />
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>{leader.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <Mail size={12} /> {leader.email}
                        </div>
                        {leader.mobile && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <Phone size={12} /> {leader.mobile}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Assign Team Members</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
                    {formData.teamMembers.length > 0 ? (
                      formData.teamMembers.map(id => {
                        const u = availableUsers.find(user => user._id === id);
                        if (!u) return null;
                        return (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600', animation: 'fadeIn 0.2s ease' }}>
                            {u.name}
                            <X size={14} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => handleMemberToggle(id)} />
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.7 }}>No members assigned yet...</p>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div 
                      onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                      style={{ 
                        background: 'var(--bg-input)', border: '1px solid var(--border)', 
                        borderRadius: '12px', padding: '0.75rem 1rem', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        color: formData.teamMembers.length > 0 ? 'var(--text-main)' : 'var(--text-muted)'
                      }}
                    >
                      <span>{formData.teamMembers.length > 0 ? `${formData.teamMembers.length} Members Selected` : 'Select Team Members...'}</span>
                      <Users size={16} />
                    </div>

                    {showMemberDropdown && (
                      <div style={{ 
                        position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', 
                        background: 'var(--bg-dark)', border: '1px solid var(--border)', 
                        borderRadius: '14px', zIndex: 100,
                        maxHeight: '300px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease'
                      }}>
                        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="text" 
                              placeholder="Search members..." 
                              autoFocus
                              value={memberSearch} 
                              onChange={e => setMemberSearch(e.target.value)} 
                              style={{ paddingLeft: '2.3rem', fontSize: '0.85rem', marginBottom: 0, background: 'rgba(0,0,0,0.2)' }} 
                            />
                          </div>
                          <button type="button" onClick={() => { setShowMemberDropdown(false); setMemberSearch(''); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <X size={16} />
                          </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                          {availableUsers.filter(u => u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase())).map(u => (
                            <div key={u._id} onClick={() => { handleMemberToggle(u._id); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: formData.teamMembers.includes(u._id) ? 'rgba(99,102,241,0.08)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.02)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = formData.teamMembers.includes(u._id) ? 'rgba(99,102,241,0.08)' : 'transparent'}>
                              <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: formData.teamMembers.includes(u._id) ? 'var(--primary)' : 'var(--text-main)' }}>{u.name}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.role} · {u.email}</p>
                              </div>
                              {formData.teamMembers.includes(u._id) && <CheckCircle2 size={16} color="var(--primary)" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>KBase</label>
                  <div
                    onClick={() => knowledgeBaseInputRef.current?.click()}
                    onDragEnter={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingKnowledgeBase(true);
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingKnowledgeBase(true);
                    }}
                    onDragLeave={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.currentTarget === e.target) setIsDraggingKnowledgeBase(false);
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingKnowledgeBase(false);
                      handleKnowledgeBaseSelect(e.dataTransfer.files);
                    }}
                    style={{
                      border: `1px dashed ${isDraggingKnowledgeBase ? 'rgba(99,102,241,0.7)' : 'var(--border)'}`,
                      background: isDraggingKnowledgeBase ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      ref={knowledgeBaseInputRef}
                      type="file"
                      onChange={e => {
                        handleKnowledgeBaseSelect(e.target.files);
                        e.target.value = '';
                      }}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.45rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <Upload size={18} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>Drag and drop document here</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>or click to browse a kbase file</p>
                      </div>
                    </div>
                  </div>

                  {(knowledgeBaseFile || editingProject?.knowledgeBase) && (
                    <div style={{ marginTop: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>
                        <FileText size={14} />
                        <span>{knowledgeBaseFile?.name || editingProject?.knowledgeBaseOriginalName || 'kbase document'}</span>
                        {knowledgeBaseFile && (
                          <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(event) => { event.stopPropagation(); setKnowledgeBaseFile(null); }} />
                        )}
                      </div>
                      {!knowledgeBaseFile && editingProject?.knowledgeBase && (
                        <button
                          type="button"
                          onClick={() => window.open(getKnowledgeBaseUrl(editingProject), '_blank', 'noopener,noreferrer')}
                          className="btn btn-outline"
                        >
                          <ExternalLink size={16} /> View
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ height: '120px' }} />
              </form>
            </div>

            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', background: 'var(--bg-card)' }}>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" form="project-form" disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
                {saving ? 'Processing...' : editingProject ? 'Update Details' : 'Register Project'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Team Member Info Modal */}
      {infoProject && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000,
          padding: '1.5rem'
        }} onClick={() => setInfoProject(null)}>
          <div 
            onClick={e => e.stopPropagation()}
            style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--border)', 
              width: '100%', maxWidth: '500px', borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.3s ease'
            }}
          >
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>{infoProject.name} Team</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project Members & Assignments</p>
              </div>
              <button onClick={() => setInfoProject(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Leader First */}
                {infoProject.teamLeader && (
                  <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Leader</span>
                      <Shield size={14} color="var(--primary)" />
                    </div>
                    <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>{infoProject.teamLeader.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{infoProject.teamLeader.email}</p>
                  </div>
                )}

                {/* Team Members */}
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>Team Members ({infoProject.teamMembers?.length || 0})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {infoProject.teamMembers?.map(m => (
                      <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderRadius: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>
                          {m.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{m.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.role} · {m.email}</p>
                        </div>
                      </div>
                    ))}
                    {!infoProject.teamMembers?.length && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem' }}>No team members assigned.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
              <button onClick={() => setInfoProject(null)} className="btn btn-primary" style={{ minWidth: '120px' }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes modalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, projectId: null })}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
      />

    </div>
  );
};

export default Projects;