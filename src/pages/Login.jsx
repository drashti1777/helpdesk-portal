import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, Rocket, Shield, Layers, Sparkles } from 'lucide-react';
import API_BASE_URL from '../config';
import PoweredByThemidnight from '../components/Branding/PoweredByThemidnight';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const payload = { ...formData, email: formData.email.trim() };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (isRegister) {
          setIsRegister(false);
          setError('');
        } else {
          login(data);
          navigate('/projects');
        }
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* Decorative blobs */}
      <div className="login-blob" style={{
        top: '-10%', left: '-8%', width: '460px', height: '460px',
        background: 'radial-gradient(circle, #5d87ff 0%, transparent 70%)',
        animation: 'blob1 16s ease-in-out infinite alternate',
      }} />
      <div className="login-blob" style={{
        bottom: '-15%', right: '-10%', width: '520px', height: '520px',
        background: 'radial-gradient(circle, #49beff 0%, transparent 70%)',
        animation: 'blob2 20s ease-in-out infinite alternate',
      }} />
      <div className="login-blob" style={{
        top: '40%', right: '20%', width: '320px', height: '320px',
        background: 'radial-gradient(circle, #13deb9 0%, transparent 70%)',
        opacity: 0.25,
      }} />

      <div className="login-card animate-fade-in">
        {/* ── Left illustration panel ─────────────────────────────────────── */}
        <div className="login-left">
          <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', padding: '0.4rem 0.9rem', borderRadius: '999px',
              background: 'var(--primary-soft)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.5rem',
              alignItems: 'center', gap: 6, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <Sparkles size={13} /> Helpdesk Portal
            </div>

            <h2 style={{
              fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.2,
              color: 'var(--text-heading)', marginBottom: '0.85rem',
            }}>
              Manage every request,<br />
              <span style={{
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>beautifully.</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginBottom: '2.25rem' }}>
              A premium support platform that brings your team, tickets, and clients together.
            </p>

            {/* Stylised illustration */}
            <div style={{
              position: 'relative', height: '280px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* dashboard mockup card */}
              <div className="animate-float" style={{
                width: '320px', height: '210px',
                background: '#fff', borderRadius: '18px',
                boxShadow: '0 24px 60px rgba(45,55,72,0.14), 0 6px 18px rgba(45,55,72,0.06)',
                border: '1px solid var(--border)',
                padding: '14px', position: 'relative', zIndex: 2,
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    width: '70px', height: '10px', borderRadius: '4px',
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['#fa896b', '#ffae1f', '#13deb9'].map(c => (
                      <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { v: '128', l: 'Total', c: '#5d87ff' },
                    { v: '42', l: 'Open', c: '#ffae1f' },
                    { v: '86', l: 'Done', c: '#13deb9' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-muted)', borderRadius: '10px', padding: '10px',
                    }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', fontWeight: 600 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[0.6, 0.8, 0.45].map((w, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px', borderRadius: '8px',
                      background: i === 0 ? 'var(--primary-soft)' : 'transparent',
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : 'var(--border)' }} />
                      <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--border)' }}>
                        <div style={{ width: `${w * 100}%`, height: '100%', borderRadius: 4, background: 'var(--success)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* floating chip 1 */}
              <div className="animate-float" style={{
                position: 'absolute', top: '15px', left: '0px', zIndex: 3,
                background: '#fff', padding: '10px 14px', borderRadius: '14px',
                boxShadow: '0 12px 28px rgba(45,55,72,0.12)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10, animationDelay: '1s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--success-soft)', color: 'var(--success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Resolved</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>+24 today</div>
                </div>
              </div>

              {/* floating chip 2 */}
              <div className="animate-float" style={{
                position: 'absolute', bottom: '10px', right: '0px', zIndex: 3,
                background: '#fff', padding: '10px 14px', borderRadius: '14px',
                boxShadow: '0 12px 28px rgba(45,55,72,0.12)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10, animationDelay: '2.5s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--primary-soft)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Layers size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Projects</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>12 active</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <PoweredByThemidnight />
            </div>
          </div>
        </div>

        {/* ── Right form panel ────────────────────────────────────────────── */}
        <div className="login-right">
          <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
            <div className="brand-logo" style={{ marginBottom: '2.25rem' }}>
              <span className="brand-mark"><Rocket size={18} strokeWidth={2.5} /></span>
              Helpdesk Portal
            </div>

            <h1 style={{
              fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-heading)',
              marginBottom: '0.4rem', letterSpacing: '-0.01em',
            }}>
              {isRegister ? 'Create your account' : 'Welcome to Helpdesk Portal'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
              {isRegister ? 'Join your team in minutes.' : 'Your Admin Dashboard'}
            </p>

            {error && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.1rem',
                background: 'var(--danger-soft)', border: '1px solid rgba(250,137,107,0.3)',
                color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div>
                  <label>Full Name</label>
                  <input
                    type="text" placeholder="Jane Cooper" required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label>{isRegister ? 'Email Address' : 'Username'}</label>
                <input
                  type="email" placeholder="you@company.com" required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label>Password</label>
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    style={{ paddingRight: '2.75rem', marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '0.85rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--text-subtle)', padding: 0,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label>Account Type</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="employee">Employee — Internal IT Requests</option>
                    <option value="team_leader">Team Leader — Management</option>
                    <option value="hr">HR — Personnel Management</option>
                    <option value="admin">Admin — System Administration</option>
                  </select>
                </div>
              )}

              {!isRegister && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer',
                    fontWeight: 500, marginBottom: 0,
                  }}>
                    <input
                      type="checkbox" checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    Remember this Device
                  </label>
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); alert('Please contact your IT administrator or Team Leader to reset your password.'); }}
                    style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', borderRadius: 'var(--radius)' }}
              >
                {loading ? <><span className="tm-spin" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Please wait…</> : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p style={{
              marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem',
              color: 'var(--text-muted)',
            }}>
              {isRegister ? 'Already have an account?' : 'New to Helpdesk?'}{' '}
              <span
                style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
              >
                {isRegister ? 'Sign In' : 'Create new account'}
              </span>
            </p>

            <div style={{ marginTop: '2rem', textAlign: 'center' }} className="hide-mobile" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
