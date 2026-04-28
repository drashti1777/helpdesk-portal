import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Star, MessageSquare, User, Calendar, Ticket, ExternalLink, Filter, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Feedbacks = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 5star, 4star, etc.

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tickets', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        // Filter for completed tickets that have a rating
        const ratedTickets = (Array.isArray(data) ? data : [])
          .filter(t => t.status === 'completed' && t.rating)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setTickets(ratedTickets);
      } catch (err) {
        console.error('Failed to fetch feedbacks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, [user.token]);

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    return t.rating === parseInt(filter);
  });

  const avgRating = tickets.length > 0 
    ? (tickets.reduce((sum, t) => sum + t.rating, 0) / tickets.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.03em' }}>Review Center</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
              Track customer satisfaction and service quality benchmarks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem 1.5rem', background: 'var(--glass)', borderRadius: '16px', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{ padding: '0.6rem', background: 'rgba(245,158,11,0.1)', borderRadius: '12px' }}>
                <Star size={24} color="#f59e0b" fill="#f59e0b" />
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Avg. Rating</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{avgRating} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>/ 5.0</span></h3>
              </div>
            </div>
            <div style={{ 
              padding: '1rem 1.5rem', background: 'var(--glass)', borderRadius: '16px', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{ padding: '0.6rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
                <TrendingUp size={24} color="#10b981" />
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Reviews</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{tickets.length}</h3>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div style={{ 
        marginBottom: '2rem', display: 'flex', gap: '0.75rem', padding: '0.5rem', 
        background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--border)', width: 'fit-content'
      }}>
        {[
          { id: 'all', label: 'All Reviews' },
          { id: '5', label: '5 Stars' },
          { id: '4', label: '4 Stars' },
          { id: '3', label: '3 Stars' },
          { id: '2', label: '2 Stars' },
          { id: '1', label: '1 Star' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600',
              background: filter === opt.id ? 'var(--primary)' : 'transparent',
              color: filter === opt.id ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid of reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {filteredTickets.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'var(--glass)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <Star size={48} color="var(--text-muted)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-muted)' }}>No reviews found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try changing your filter or wait for clients to submit feedback.</p>
          </div>
        ) : (
          filteredTickets.map(t => (
            <div 
              key={t._id}
              className="glass-card"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              {/* Header: Stars + Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} size={18} 
                      color={star <= t.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)'} 
                      fill={star <= t.rating ? '#f59e0b' : 'none'} 
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <Calendar size={14} />
                  {new Date(t.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Feedback Message */}
              <div style={{ flex: 1 }}>
                <p style={{ 
                  fontSize: '1rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.6',
                  background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)'
                }}>
                  "{t.feedback || 'The client left no written feedback.'}"
                </p>
              </div>

              {/* Meta Info: Client + Employee */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.2rem' }}>Client</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                      {t.createdBy?.name?.charAt(0)}
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.createdBy?.name}</p>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.2rem' }}>Resolved By</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#6ee7b7', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#065f46' }}>
                      {t.assignedTo?.name?.charAt(0)}
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.assignedTo?.name}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Link */}
              <div 
                onClick={() => navigate(`/tickets/${t._id}`)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', 
                  fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start'
                }}
              >
                <Ticket size={14} />
                View Ticket Details
                <ExternalLink size={12} />
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .loader {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Feedbacks;
