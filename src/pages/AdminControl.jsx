import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Settings, 
  Clock, 
  Lock, 
  Save, 
  AlertTriangle, 
  UserPlus, 
  Power, 
  Database,
  CheckCircle2,
  ChevronRight,
  XCircle
} from 'lucide-react';

const AdminControl = () => {
  const { user } = useContext(AuthContext);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState({ message: '', type: '' });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/system/config', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      setConfig(data);
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleSave = async (target) => {
    setSaving(true);
    try {
      const endpoint = target === 'permissions' ? 'permissions' : 'settings';
      const body = target === 'permissions' ? { rolePermissions: config.rolePermissions } : config.settings;
      
      const res = await fetch(`http://localhost:5000/api/system/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        setConfig(data); // Update local state with saved config
        showToast(`${target.charAt(0).toUpperCase() + target.slice(1)} saved successfully!`);
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch('http://localhost:5000/api/system/backup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
      } else {
        showToast('Backup failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setBackingUp(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loader"></div>
      </div>
    );
  }

  const Toggle = ({ checked, onChange, label, desc }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.1rem' }}>{label}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <div 
        onClick={() => onChange(!checked)}
        style={{
          width: '44px', height: '24px', borderRadius: '12px',
          background: checked ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
          position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease',
          boxShadow: checked ? '0 0 10px rgba(99,102,241,0.3)' : 'none'
        }}
      >
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
          position: 'absolute', top: '3px', left: checked ? '23px' : '3px',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }} />
      </div>
    </div>
  );

  return (
    <div className="main-content animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Premium Toast */}
      {toast.message && (
        <div style={{ 
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 10000,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideIn 0.4s ease-out'
        }}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{toast.message}</span>
        </div>
      )}

      <header style={{ marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <ShieldCheck size={28} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.03em' }}>Control Center</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Command the system architecture and security protocols.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '14px', border: '1px solid var(--border)', width: 'fit-content' }}>
          {[
            { id: 'general', icon: Settings, label: 'General' },
            { id: 'sla', icon: Clock, label: 'SLA & Priority' },
            { id: 'permissions', icon: Lock, label: 'Permissions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem',
                borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease', border: 'none', cursor: 'pointer'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ background: 'var(--glass)', borderRadius: '20px', border: '1px solid var(--border)', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        
        {/* GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <Power size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>System Configuration</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Toggle 
                label="Self Registration" 
                desc="Allow new clients to register accounts"
                checked={config.settings.allowSelfRegistration}
                onChange={(v) => setConfig(p => ({...p, settings: {...p.settings, allowSelfRegistration: v}}))}
              />
              <Toggle 
                label="Employee Signups" 
                desc="Allow employees to register themselves"
                checked={config.settings.allowEmployeeSelfRegistration}
                onChange={(v) => setConfig(p => ({...p, settings: {...p.settings, allowEmployeeSelfRegistration: v}}))}
              />
              <Toggle 
                label="Maintenance Mode" 
                desc="Only administrators can access the portal"
                checked={config.settings.maintenanceMode}
                onChange={(v) => setConfig(p => ({...p, settings: {...p.settings, maintenanceMode: v}}))}
              />
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Default Priority</p>
                <select
                  value={config.settings.defaultPriority || 'low'}
                  onChange={(e) => setConfig((prev) => ({ ...prev, settings: { ...prev.settings, defaultPriority: e.target.value } }))}
                  style={{ width: '100%', marginBottom: 0 }}
                >
                  <option value="low">Low (Standard)</option>
                  <option value="medium">Medium (Moderate)</option>
                  <option value="high">High (Urgent)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Database size={24} color="#f59e0b" />
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f59e0b' }}>System Snapshots</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Backup system logs and configurations to cloud storage.</p>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={handleBackup}
                disabled={backingUp}
                style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'none', minWidth: '120px' }}
              >
                {backingUp ? 'Backing up...' : 'Run Backup'}
              </button>
            </div>
          </div>
        )}

        {/* SLA SETTINGS */}
        {activeTab === 'sla' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <Clock size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Service Level Agreement</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              {[
                { key: 'slaHighResponse', label: 'High Priority', color: '#ef4444', default: 2 },
                { key: 'slaMediumResponse', label: 'Medium Priority', color: '#f59e0b', default: 8 },
                { key: 'slaLowResponse', label: 'Low Priority', color: '#10b981', default: 24 },
              ].map(sla => (
                <div key={sla.key} style={{ padding: '1.5rem', borderRadius: '16px', border: `1px solid ${sla.color}30`, background: `${sla.color}08`, textAlign: 'center' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: sla.color, margin: '0 auto 1rem', boxShadow: `0 0 10px ${sla.color}50` }} />
                  <p style={{ fontWeight: '700', fontSize: '0.85rem', color: sla.color, textTransform: 'uppercase', marginBottom: '1rem' }}>{sla.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      value={config.settings[sla.key] || sla.default} 
                      onChange={e => setConfig(p => ({...p, settings: {...p.settings, [sla.key]: Number(e.target.value)}}))}
                      style={{ width: '70px', fontSize: '1.2rem', fontWeight: '800', textAlign: 'center', background: 'transparent', border: 'none', borderBottom: `2px solid ${sla.color}40`, marginBottom: 0 }}
                    />
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>HRS</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Target Response Time</p>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <AlertTriangle size={20} color="var(--text-muted)" />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Modifying SLA times will affect existing tickets. Notifications will be triggered for tickets that exceed these new thresholds.
              </p>
            </div>
          </div>
        )}

        {/* PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <Lock size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Role Access Control</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(config.rolePermissions || {})
                .filter(([role]) => role !== 'super_admin' && role !== 'admin')
                .map(([role, permissions]) => (
                <div key={role} style={{ 
                  padding: '1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem' 
                }}>
                  <div style={{ width: '120px' }}>
                    <p style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)' }}>{role.replace('_', ' ')}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{permissions.length} nodes active</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text"
                      value={(permissions || []).join(', ')}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          rolePermissions: {
                            ...prev.rolePermissions,
                            [role]: e.target.value.split(',').map((p) => p.trim()).filter(Boolean)
                          }
                        }))
                      }
                      placeholder="Enter permissions separated by commas..."
                      style={{ marginBottom: 0, fontSize: '0.85rem' }}
                    />
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            disabled={saving} 
            onClick={() => handleSave(activeTab === 'permissions' ? 'permissions' : 'settings')}
            style={{ 
              padding: '0.8rem 2.5rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700',
              boxShadow: '0 10px 20px rgba(99,102,241,0.2)'
            }}
          >
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Saving...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> Commit Changes
              </span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .loader {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdminControl;
