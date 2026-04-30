import API_BASE_URL from '../../config';
import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  X, UserPlus, Save, Sparkles, Mail, Phone, Lock, Shield
} from 'lucide-react';

const AddUserDrawer = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      email: formData.email.trim()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess?.(data);
        onClose();
        setFormData({ name: '', email: '', mobile: '', password: '', role: 'employee' });
      } else {
        window.dispatchEvent(new CustomEvent('show-notification', { 
          detail: { type: 'error', message: data.message || 'Failed to add user' } 
        }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-notification', { 
        detail: { type: 'error', message: 'Server error while adding user' } 
      }));
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
    fontSize: '0.9rem', outline: 'none',
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
                <UserPlus size={16} color="#818cf8" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Add New User</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Register a new member to the platform.</p>
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

            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" placeholder="e.g. John Doe" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                <input
                  type="email" placeholder="john@example.com" required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: '3rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label style={labelStyle}>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                <input
                  type="tel" placeholder="+1 234 567 890"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: '3rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Temporary Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                <input
                  type="password" placeholder="••••••••" required minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: '3rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label style={labelStyle}>System Role</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5, pointerEvents: 'none' }} />
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: '3rem', cursor: 'pointer' }}
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR Role</option>
                  <option value="team_leader">Team Leader</option>
                  {isAdmin && <option value="admin">Admin</option>}
                </select>
              </div>
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
                {loading ? 'Creating...' : <><Save size={18} /> Create User</>}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
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
        select option { background: var(--bg-card); color: var(--text-main); }
      `}</style>
    </>,
    document.body
  );
};

export default AddUserDrawer;
