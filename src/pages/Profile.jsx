import API_BASE_URL from '../config';
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Save, Camera, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated successfully!');
        // Update local context/storage with new user data
        login({ ...data.user, token: user.token });
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Network error, please try again', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="main-content animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 1000,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
          color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideInRight 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span style={{ fontWeight: '600' }}>{toast.msg}</span>
        </div>
      )}

      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Manage your account details and security preferences.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Panel - Avatar & Info */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', height: 'fit-content' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: '700', color: '#fff',
              boxShadow: '0 10px 25px rgba(99,102,241,0.3)'
            }}>
              {getInitials(user?.name)}
            </div>
            <button style={{
              position: 'absolute', bottom: '5px', right: '5px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#fff', border: 'none', color: '#1a1d24',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
              <Camera size={16} />
            </button>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{user?.email}</p>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', borderRadius: '999px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            color: '#a5b4fc', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <Shield size={14} />
            {user?.role?.replace('_', ' ')}
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Change Password</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '1rem', borderRadius: '12px', marginTop: '1rem' }}
            >
              {loading ? 'Saving Changes...' : <><Save size={18} /> Update Profile</>}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
