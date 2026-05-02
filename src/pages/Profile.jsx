import API_BASE_URL from '../config';
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  User, Mail, Lock, Save, Camera, Shield, CheckCircle2,
  AlertCircle, Sun, Moon, Eye, EyeOff, Bug, Trophy, Gift
} from 'lucide-react';
import Badge from '../components/Badge';
import { TIERS, nextTier, tierProgress, ELIGIBLE_ROLES } from '../utils/gamification';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: user?.name ? user.name.split(' ')[0] : '',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Gamification data
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${API_BASE_URL}/api/users/me/gamification`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setGamification(data))
      .catch(() => setGamification(null));
  }, [user?.token]);

  // Theme state synced with Sidebar/Body
  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light');

  useEffect(() => {
    const handleGlobalTheme = (e) => setIsLight(e.detail.isLight);
    window.addEventListener('theme-changed', handleGlobalTheme);
    return () => window.removeEventListener('theme-changed', handleGlobalTheme);
  }, []);

  const toggleLocalTheme = () => {
    const next = !isLight;
    setIsLight(next);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isLight: next } }));
  };

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
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated successfully!');
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
    <div className="main-content animate-fade-in" style={{ maxWidth: '2000px', margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 1000,
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideInRight 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span style={{ fontWeight: '600' }}>{toast.msg}</span>
        </div>
      )}

      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Manage your profile details and application preferences.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1.25rem' }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: '700', color: '#fff',
                boxShadow: '0 10px 25px rgba(99,102,241,0.3)'
              }}>
                {getInitials(user?.name)}
              </div>
              <button style={{
                position: 'absolute', bottom: '2px', right: '2px',
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                <Camera size={14} />
              </button>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.2rem', color: 'var(--text-main)' }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{user?.email}</p>
            
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.35rem 0.85rem', borderRadius: '999px',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              <Shield size={12} />
              {user?.role?.replace('_', ' ')}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-main)' }}>Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Theme Mode</span>
                <button
                  onClick={toggleLocalTheme}
                  style={{
                    background: 'var(--glass)', border: '1px solid var(--border)',
                    width: '40px', height: '40px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-main)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--glass)'; }}
                  title="Toggle Theme"
                >
                  {isLight ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </div>
            </div>
          </div>

          {gamification && ELIGIBLE_ROLES.includes(gamification.role) && (
            <AchievementsCard data={gamification} />
          )}
        </div>

        {/* Right Panel - Form */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>First Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    required
                    autoComplete="off"
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none', marginBottom: 0 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    required
                    autoComplete="off"
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none', marginBottom: 0 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact No</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={e => setFormData({...formData, mobile: e.target.value})}
                    autoComplete="off"
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none', marginBottom: 0 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                    autoComplete="off"
                    style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none', marginBottom: 0 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ margin: '2.5rem 0', padding: '1.5rem', background: 'var(--glass)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={16} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>Security & Password</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="New Password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      autoComplete="new-password"
                      style={{ width: '100%', padding: '0.85rem 3rem 0.85rem 1.1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none', marginBottom: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      autoComplete="new-password"
                      style={{ width: '100%', padding: '0.85rem 3rem 0.85rem 1.1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none', marginBottom: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem', borderRadius: '12px', gap: '0.75rem' }}
            >
              {loading ? 'Saving Changes...' : <><Save size={20} /> Save Profile Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AchievementsCard = ({ data }) => {
  const points = data.points || 0;
  const next = nextTier(points);
  const progress = tierProgress(points);
  const earnedTiers = new Set((data.badgesEarned || []).map(b => b.tier));
  const pendingReward = (data.rewardsClaimed || []).find(r => !r.fulfilled);

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Trophy size={16} color="#fbbf24" /> Achievements
      </h3>

      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <Badge tier={data.currentBadge} size="lg" />
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.85rem', lineHeight: 1 }}>
          {points}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.25rem' }}>
          Total Points
        </p>
      </div>

      {next && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span>Next: {next.label}</span>
            <span>{points} / {next.threshold}</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.round(progress * 100)}%`,
              height: '100%',
              background: `linear-gradient(90deg, var(--primary), ${next.color})`,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.85rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{data.bugsReported || 0}</div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reported</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{data.bugsResolved || 0}</div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Verified</p>
        </div>
      </div>

      {pendingReward && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.7rem 0.85rem', borderRadius: '10px',
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          marginBottom: '1rem'
        }}>
          <Gift size={16} color="#fbbf24" />
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', textTransform: 'capitalize' }}>{pendingReward.tier} reward unlocked</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending fulfillment from admin.</p>
          </div>
        </div>
      )}

      <div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>All Tiers</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {TIERS.filter(t => t.name !== 'none').map(t => (
            <Badge key={t.name} tier={t.name} size="sm" dim={!earnedTiers.has(t.name)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
