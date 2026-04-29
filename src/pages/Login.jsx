import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Headphones, Eye, EyeOff, Shield, Layout, Users, Activity, FileText, Zap, BarChart3 } from 'lucide-react';
import loginIllustration from '../assets/login-illustration.png';
import API_BASE_URL from '../config';


const ROLE_INFO = {
  admin: { label: 'Admin', desc: 'Manage team & all tickets', color: '#a5b4fc' },
  team_leader: { label: 'Team Leader', desc: 'Oversee team and client support', color: '#c084fc' },
  employee: { label: 'Employee (Internal)', desc: 'Raise internal IT support tickets', color: '#6ee7b7' },
  client: { label: 'Client (External)', desc: 'Report website or app issues', color: '#94a3b8' },
};

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const payload = {
        ...formData,
        email: formData.email.trim()
      };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
        navigate('/');

      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    marginBottom: '1rem',
    padding: '0.8rem 1rem',
    background: '#12141a',
    border: '1px solid #2d333e',
    borderRadius: '10px',
    color: '#ffffff',
    width: '100%',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#ffffff',
    }}>
      {/* Left Panel — Branding */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '3rem',
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        position: 'relative', overflow: 'hidden'
      }} className="hide-mobile">
        {/* Premium Animated Mesh Gradient Background */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
          zIndex: 0
        }} />

        {/* Dot Grid Overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)',
          backgroundSize: '30px 30px', opacity: 0.1, zIndex: 1
        }} />

        {/* Vibrant Animated Blobs */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%', width: '60%', height: '60%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0) 70%)',
          borderRadius: '50%', filter: 'blur(80px)', animation: 'mesh-1 15s infinite alternate ease-in-out'
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%', width: '70%', height: '70%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0) 70%)',
          borderRadius: '50%', filter: 'blur(100px)', animation: 'mesh-2 20s infinite alternate-reverse ease-in-out'
        }} />
        <div style={{
          position: 'absolute', top: '20%', left: '20%', width: '40%', height: '40%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
          borderRadius: '50%', filter: 'blur(60px)', animation: 'mesh-3 12s infinite alternate ease-in-out'
        }} />

        {/* Floating "Data Points" (Particles) */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 2 === 0 ? '6px' : '4px',
            height: i % 2 === 0 ? '6px' : '4px',
            background: 'var(--primary)',
            borderRadius: '50%',
            opacity: 0.3,
            top: `${20 + (i * 12)}%`,
            left: `${15 + (i * 8)}%`,
            animation: `float-particle ${10 + i}s infinite ease-in-out`,
            boxShadow: '0 0 10px var(--primary)'
          }} />
        ))}

        {/* Floating Glass Circles for depth */}
        <div style={{
          position: 'absolute', top: '10%', left: '15%', width: '140px', height: '140px',
          background: 'rgba(255,255,255,0.4)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)',
          animation: 'morph 15s infinite ease-in-out'
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%', width: '100px', height: '100px',
          background: 'rgba(255,255,255,0.3)', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.4)',
          animation: 'morph 18s infinite ease-in-out reverse'
        }} />

        <div style={{
          maxWidth: '800px', width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative', zIndex: 1, padding: '2rem 1rem'
        }}>
          {/* Top Logo & Title */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(1rem, 4vh, 2.5rem)' }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '64px', height: '64px', position: 'relative', background: '#4f46e5', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                <Shield size={36} color="#fff" strokeWidth={2.5} />
                <div style={{ position: 'absolute', top: '55%', transform: 'translateY(-50%)' }}>
                  <Headphones size={22} color="#fff" strokeWidth={2.5} />
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ fontSize: '2.8rem', fontWeight: '850', color: '#1e293b', lineHeight: 0.9, letterSpacing: '-0.02em' }}>
                  Unified <br />
                  <span style={{ color: '#4f46e5' }}>Helpdesk Portal</span>
                </h1>
              </div>
            </div>
            <div style={{ width: '60px', height: '4px', background: '#4f46e5', borderRadius: '2px', margin: '0 auto 1.5rem' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#475569', maxWidth: '480px', margin: '0 auto' }}>
              One platform for employees and clients to manage IT support tickets efficiently.
            </p>
          </div>

          <div style={{ position: 'relative', width: '100%', flex: '1 1 auto', minHeight: '300px', maxHeight: '500px' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '500px' }}>
                {/* The Laptop - Improved 3D depth */}
                <div style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                  width: 'min(460px, 90%)', height: 'auto', aspectRatio: '460/300', background: '#1e222d', borderRadius: '20px',
                  padding: '12px', boxShadow: '0 50px 100px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.1)', zIndex: 10, border: '1px solid #334155'
                }}>
                  {/* Screen - Realistic Glass Effect */}
                  <div style={{
                    background: '#fff', width: '100%', height: '100%', borderRadius: '12px',
                    overflow: 'hidden', display: 'flex', position: 'relative'
                  }}>
                    {/* Screen Reflection Overlay */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
                      pointerEvents: 'none', zIndex: 5
                    }} />

                    {/* Sidebar Mockup */}
                    <div style={{ width: '90px', background: '#f1f5f9', borderRight: '1px solid #e2e8f0', padding: '12px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#4f46e5', borderRadius: '6px', marginBottom: '15px' }} />
                      {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ width: '100%', height: '8px', background: i === 0 ? 'rgba(79,70,229,0.1)' : '#e2e8f0', borderRadius: '4px', marginBottom: '10px' }} />
                      ))}
                    </div>
                    {/* Dashboard Content */}
                    <div style={{ flex: 1, padding: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div style={{ width: '80px', height: '12px', background: '#e2e8f0', borderRadius: '6px' }} />
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f1f5f9' }} />
                      </div>
                      {/* Stats - Claymorphic style */}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        {[
                          { l: 'Total', v: '128', c: '#6366f1' },
                          { l: 'Open', v: '42', c: '#f59e0b' }
                        ].map((s, i) => (
                          <div key={i} style={{ flex: 1, background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{s.l}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                      {/* List Mockup */}
                      <div style={{ background: '#f8fafc', borderRadius: '12px', height: '120px', padding: '10px' }}>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: i === 0 ? '#4f46e5' : '#cbd5e1', opacity: 0.3 }} />
                            <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px' }} />
                            <div style={{ width: '40px', height: '14px', borderRadius: '7px', background: i === 0 ? '#dcfce7' : '#f1f5f9' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Laptop Base - Better Shadow */}
                  <div style={{
                    position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)',
                    width: '520px', height: '14px', background: '#2d3343', borderRadius: '0 0 20px 20px',
                    boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ width: '100px', height: '4px', background: '#475569', borderRadius: '2px', margin: '3px auto' }} />
                  </div>
                </div>

                {/* Characters - Claymorphism shapes */}
                {/* Man on Left */}
                <div style={{ position: 'absolute', left: '10px', bottom: '20px', zIndex: 15 }} className="animate-float">
                  <div style={{ width: '160px', height: '220px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '45px', width: '70px', height: '70px', background: '#ffd6cc', borderRadius: '50%', boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.1)' }} />
                    <div style={{ position: 'absolute', top: '75px', left: '30px', width: '100px', height: '140px', background: '#4f46e5', borderRadius: '40px 40px 10px 10px', boxShadow: 'inset -8px -8px 20px rgba(0,0,0,0.15)' }} />
                    <div style={{ position: 'absolute', top: '130px', left: '60px', width: '130px', height: '80px', background: '#e2e8f0', borderRadius: '15px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                {/* Woman on Right */}
                <div style={{ position: 'absolute', right: '10px', bottom: '20px', zIndex: 15, animationDelay: '2s' }} className="animate-float">
                  <div style={{ width: '160px', height: '220px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '45px', width: '70px', height: '70px', background: '#ffe8d1', borderRadius: '50%', boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.1)' }} />
                    <div style={{ position: 'absolute', top: '5px', left: '40px', width: '80px', height: '60px', background: '#334155', borderRadius: '40px 40px 0 0' }} />
                    <div style={{ position: 'absolute', top: '75px', left: '30px', width: '100px', height: '140px', background: '#7c3aed', borderRadius: '40px 40px 10px 10px', boxShadow: 'inset -8px -8px 20px rgba(0,0,0,0.15)' }} />
                    <div style={{ position: 'absolute', top: '130px', left: '-30px', width: '130px', height: '80px', background: '#e2e8f0', borderRadius: '15px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                {/* Bubbles - Glassmorphic */}
                <div style={{
                  position: 'absolute', top: '120px', left: '-20px', padding: '12px 20px',
                  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                  borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: '10px', zIndex: 25, border: '1px solid #fff'
                }} className="animate-float">
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color="#fff" />
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b' }}>For Employees</span>
                </div>
                <div style={{
                  position: 'absolute', top: '80px', right: '-10px', padding: '12px 20px',
                  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                  borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: '10px', zIndex: 25, border: '1px solid #fff',
                  animationDelay: '3s'
                }} className="animate-float">
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layout size={18} color="#fff" />
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b' }}>For Clients</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Feature Bar */}
          <div style={{
            display: 'flex', background: '#fff', borderRadius: '24px', padding: '1rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)', gap: '0.5rem', border: '1px solid #f1f5f9',
            marginTop: 'clamp(0.5rem, 2vh, 2rem)', position: 'relative', zIndex: 25,
            flexWrap: 'wrap', justifyContent: 'center'
          }} className="animate-slide-up">
            {[
              { icon: Zap, label: 'Easy Ticket', sub: 'Management', bg: '#eef2ff' },
              { icon: Activity, label: 'Real-time', sub: 'Updates', bg: '#fef3c7' },
              { icon: FileText, label: 'Knowledge', sub: 'Base', bg: '#ecfdf5' },
              { icon: BarChart3, label: 'Reports &', sub: 'Analytics', bg: '#f5f3ff' }
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '0.5rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                  <item.icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.1 }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e293b' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{
        width: '100%', maxWidth: '580px', background: '#111318',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          width: '100%',
          padding: '4rem 3.5rem',
          color: '#ffffff',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }} className="animate-fade-in">
          {/* Mobile brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Headphones size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: '700', fontSize: '1rem' }}>HelpDesk Portal</span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: '700', marginBottom: '0.4rem' }}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            {isRegister ? 'Join the support platform.' : 'Sign in to manage your tickets.'}
          </p>

          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>Full Name</label>
                <input
                  type="text" placeholder="Enter your full name" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>Email Address</label>
              <input
                type="email" placeholder="you@company.com" required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-60%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>Account Type</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="client">Client — External (Website / App issues)</option>
                  <option value="employee">Employee — Internal IT Requests</option>
                  <option value="team_leader">Team Leader — Management</option>
                  <option value="hr">HR — Personnel Management</option>
                  <option value="admin">Admin — System Administration</option>
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                  Note: Choose the role that best matches your responsibilities.

                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem', fontSize: '1rem', borderRadius: '10px' }}
            >
              {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {!isRegister && (
            <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem' }}>
              <span
                style={{ color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                onClick={() => alert('Please contact the IT administrator or your Team Leader to reset your password.')}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                Forgot Password?
              </span>
            </p>
          )}

          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>

            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
            >
              {isRegister ? 'Sign In' : 'Register'}
            </span>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
