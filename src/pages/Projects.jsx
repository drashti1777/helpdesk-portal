import API_BASE_URL from '../config';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Folder, RefreshCw } from 'lucide-react';
import ConfirmModal from '../components/Layout/ConfirmModal';

const Projects = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedTL, setSelectedTL] = useState('');
  const [error, setError] = useState('');
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/agents`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setTeamLeaders(data.filter(u => u.role === 'team_leader'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTeamLeaders();
  }, [user.token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ name, description: desc, teamLeader: selectedTL })
      });
      if (res.ok) {
        setName('');
        setDesc('');
        setSelectedTL('');
        fetchProjects();
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to add project');
    }
  };

  const handleDelete = async () => {
    const { id } = deleteConfirm;
    if (!id) return;
    setDeleteConfirm({ isOpen: false, id: null });
    await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    fetchProjects();
  };

  return (
    <div className="main-content animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Folder color="var(--primary)" /> Project Management
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage system-wide projects for ticketing.</p>
        </div>
        <button onClick={fetchProjects} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Add Project */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Add New Project</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Project Name</label>
              <input 
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. ERP System" required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Description</label>
              <textarea 
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Optional description..."
                style={{ minHeight: '80px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Assign Team Leader</label>
              <select value={selectedTL} onChange={e => setSelectedTL(e.target.value)} required>
                <option value="">Select a Team Leader</option>
                {teamLeaders.map(tl => (
                  <option key={tl._id} value={tl._id}>{tl.name}</option>
                ))}
              </select>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={18} /> Create Project
            </button>
          </form>
        </div>

        {/* Project List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Active Projects ({projects.length})</h3>
          {loading ? <p>Loading...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No projects found.</p> : (
                projects.map(p => (
                  <div key={p._id} style={{ 
                    padding: '1rem', background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border)', borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ fontWeight: '600' }}>{p.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.description || 'No description'}</p>
                      {p.teamLeader && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', marginTop: '0.25rem' }}>
                          Lead: {p.teamLeader.name}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: p._id })} style={{ color: '#ef4444', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will remove all project-related ticketing metadata."
      />
    </div>
  );
};

export default Projects;
