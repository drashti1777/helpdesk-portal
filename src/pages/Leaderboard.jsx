import API_BASE_URL from '../config';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Badge from '../components/Badge';
import { Trophy, Bug, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

const getInitials = (name = '') =>
  name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const ROLE_LABELS = {
  employee: 'Employee',
  team_leader: 'Team Leader',
  hr: 'HR',
  admin: 'Admin',
  client: 'Client',
};

const Leaderboard = ({ embedded = false }) => {
  const { user } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard?limit=50`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Leaderboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.token]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className={embedded ? "animate-fade-in" : "main-content animate-fade-in"} style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
            <Trophy size={32} color="#fbbf24" /> Bug Bounty Leaderboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.25rem' }}>
            Top contributors who help us ship better software by reporting bugs.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <RefreshCw size={32} className="animate-spin" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading leaderboard…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={42} style={{ opacity: 0.25, marginBottom: '1rem' }} />
          <p style={{ fontWeight: 600 }}>No bug hunters yet.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Once employees report and verify bugs, points will start showing up here.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${podium.length}, 1fr)`, gap: '1.25rem', marginBottom: '2rem' }}>
              {podium.map((p, idx) => {
                const ranks = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
                return (
                  <div key={p._id} className="glass-card" style={{
                    padding: '1.75rem 1.5rem',
                    textAlign: 'center',
                    border: idx === 0 ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--border)',
                    background: idx === 0 ? 'rgba(251,191,36,0.05)' : 'var(--glass)',
                    transform: idx === 0 ? 'translateY(-8px)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: idx === 0 ? '#fbbf24' : 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.06em' }}>
                      {ranks[idx]}
                    </div>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1rem', fontWeight: 800, fontSize: '1.5rem', color: '#fff',
                      boxShadow: idx === 0 ? '0 12px 32px rgba(251,191,36,0.35)' : '0 8px 18px rgba(0,0,0,0.25)'
                    }}>
                      {getInitials(p.name)}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                      {ROLE_LABELS[p.role] || p.role}
                    </p>
                    <div style={{ marginBottom: '0.85rem' }}>
                      <Badge tier={p.currentBadge} size="md" />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                      {p.points}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '0.25rem' }}>Points</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Bug size={13} /> {p.bugsReported} reported</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={13} color="#10b981" /> {p.bugsResolved} verified</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 130px 130px 100px 110px',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.07em'
            }}>
              <span>Rank</span>
              <span>Member</span>
              <span>Role</span>
              <span>Badge</span>
              <span style={{ textAlign: 'right' }}>Points</span>
              <span style={{ textAlign: 'right' }}>Bugs (✓/total)</span>
            </div>
            {rows.map((p, idx) => {
              const isMe = String(p._id) === String(user._id);
              return (
                <div key={p._id} style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 130px 130px 100px 110px',
                  alignItems: 'center', padding: '0.85rem 1.5rem',
                  borderBottom: idx < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isMe ? 'rgba(99,102,241,0.06)' : 'transparent',
                  transition: 'background 0.2s ease'
                }}>
                  <span style={{ fontWeight: 800, color: idx < 3 ? '#fbbf24' : 'var(--text-muted)' }}>#{idx + 1}</span>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{p.name}</span>
                    {isMe && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', fontWeight: 800, background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>
                        You
                      </span>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {ROLE_LABELS[p.role] || p.role}
                  </span>
                  <Badge tier={p.currentBadge} size="sm" />
                  <span style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{p.points}</span>
                  <span style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {p.bugsResolved} / {p.bugsReported}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Leaderboard;
