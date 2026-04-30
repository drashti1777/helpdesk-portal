import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft, Send, Paperclip, Clock, User as UserIcon,
  CheckCircle, RefreshCcw, AlertTriangle, Shield, Trash2, UserCheck, Star, FileText, Bug, ShieldCheck
} from 'lucide-react';
import ConfirmModal from '../components/Layout/ConfirmModal';

const STATUS_CONFIG = {
  pending:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    label: 'Pending'     },
  in_progress: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'In Progress' },
  on_hold:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'On Hold'     },
  resolved:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Resolved'    },
  completed:   { color: '#059669', bg: 'rgba(5,150,105,0.15)',  label: 'Verified'    },
};

const ROLE_COLORS = {
  admin: '#a5b4fc',
  team_leader: '#c084fc',
  employee: '#6ee7b7',
};

const getInitials = (name = '') => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const CommentBubble = ({ comment, currentUserId }) => {
  const isOwn = comment.userId._id === currentUserId;
  const roleColor = ROLE_COLORS[comment.userId.role] || '#94a3b8';

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: '0.75rem', color: '#fff', flexShrink: 0
      }}>
        {getInitials(comment.userId.name)}
      </div>
      <div style={{ maxWidth: '75%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem',
          flexDirection: isOwn ? 'row-reverse' : 'row'
        }}>
          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{comment.userId.name}</span>
          <span style={{
            fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '0.1rem 0.45rem', borderRadius: '999px',
            background: `${roleColor}20`, color: roleColor
          }}>
            {comment.userId.role.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {new Date(comment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{
          padding: '0.7rem 1rem', borderRadius: isOwn ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
          background: isOwn ? 'rgba(99,102,241,0.15)' : 'var(--glass)',
          border: `1px solid ${isOwn ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
          fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)'
        }}>
          {comment.content}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, valueStyle }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
    <span style={{ fontWeight: '600', fontSize: '0.875rem', ...valueStyle }}>{value}</span>
  </div>
);

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratingVal, setRatingVal] = useState(0);
  const [feedbackStr, setFeedbackStr] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ FIXED: team_leader included in all admin-level checks
  const isAdminLevel = ['admin', 'team_leader', 'hr'].includes(user.role);
  const isHR = user.role === 'hr';
  const isEmployee = user.role === 'employee';

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const ticketData = await res.json();
        setData(ticketData);

        // ✅ FIXED: Agents fetched for team_leader too
        if (isAdminLevel) {
          const empRes = await fetch(`${API_BASE_URL}/api/users/agents`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          if (empRes.ok) {
            setEmployees(await empRes.json());
          }
        }
      } else {
        const errorData = await res.json();
        setData({ error: errorData.message || 'Failed to load ticket' });
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user.token]);

  const updateTicket = async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const updated = await res.json();
      setData(prev => ({ ...prev, ticket: updated }));
    }
  };

  const handleDeleteTicket = async () => {
    setShowDeleteConfirm(false);
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    if (res.ok) navigate('/tickets');
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify({ content: newComment })
    });
    if (res.ok) {
      const comment = await res.json();
      setData(prev => ({ ...prev, comments: [...prev.comments, comment] }));
      setNewComment('');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ padding: '2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', textAlign: 'center' }}>
          <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{data.error}</p>
        </div>
        <button onClick={() => navigate('/tickets')} className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Tickets
        </button>
      </div>
    );
  }

  const { ticket, comments, projectInfo } = data;
  const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.pending;
  const isOverdue = new Date(ticket.slaResolutionDue) < new Date() && ticket.status !== 'completed';
  const isOwner = ticket.createdBy?._id === user._id;
  const isAssignedToMe = ticket.assignedTo?._id === user._id;

  const isAdmin = user.role === 'admin';
  const isTeamLeader = user.role === 'team_leader';
  const isProjectTL = isTeamLeader && projectInfo?.teamLeader?._id === user._id;

  const canManage = isAdmin ||
                   isProjectTL ||
                   (isHR && ticket.type === 'hr') ||
                   (isAssignedToMe && !isOwner);


  const canDelete = isAdmin;

  const canAssign = isAdmin || isProjectTL;

  return (
    <div className="main-content animate-fade-in">
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => navigate('/tickets')} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Status Actions */}
          {ticket.status !== 'completed' && (
            <>
              {(isAdmin || isProjectTL || isAssignedToMe) && ticket.status === 'pending' && (
                <button onClick={() => updateTicket({ status: 'in_progress' })} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  <RefreshCcw size={16} /> Start Working
                </button>
              )}
              
              {(isAdmin || isProjectTL || isAssignedToMe) && (ticket.status === 'in_progress' || ticket.status === 'on_hold') && (
                <button onClick={() => updateTicket({ status: 'resolved' })} className="btn btn-primary" style={{ background: '#10b981', fontSize: '0.85rem' }}>
                  <CheckCircle size={16} /> Mark as Resolved
                </button>
              )}

              {/* Verification Actions (Admin/TL Only) */}
              {ticket.status === 'resolved' && (isAdmin || isProjectTL) && (
                <>
                  <button onClick={() => updateTicket({ status: 'completed' })} className="btn btn-primary" style={{ background: '#059669', fontSize: '0.85rem' }}>
                    <ShieldCheck size={16} /> Verify & Complete
                  </button>
                  <button onClick={() => updateTicket({ status: 'in_progress' })} className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: '0.85rem' }}>
                    <RefreshCcw size={16} /> Reject & Reopen
                  </button>
                </>
              )}

              {(isAdmin || isProjectTL || isAssignedToMe) && ticket.status === 'in_progress' && (
                <button onClick={() => updateTicket({ status: 'on_hold' })} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  <Clock size={16} /> Hold
                </button>
              )}
            </>
          )}

          {/* Admin/TL specialized actions */}
          {(isAdmin || isProjectTL) && ticket.type !== 'bug' && ticket.status !== 'completed' && (
            <button 
              onClick={() => updateTicket({ type: 'bug' })} 
              className="btn btn-outline" 
              style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', fontSize: '0.85rem' }}
            >
              <Bug size={16} /> Approve as Bug
            </button>
          )}

          {canDelete && (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-outline" style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', fontSize: '0.85rem' }}>
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.75rem', alignItems: 'start' }}>
        {/* LEFT — Ticket content + comments */}
        <div>
          {/* Ticket Card */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${ticket.priority}`}>{ticket.priority} Priority</span>
                  <span style={{
                    padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700',
                    background: statusCfg.bg, color: statusCfg.color, textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{statusCfg.label}</span>
                  <span style={{
                    padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700',
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{ticket.type}</span>
                  {isOverdue && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                      <AlertTriangle size={11} /> OVERDUE
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: '700', lineHeight: 1.2 }}>{ticket.title}</h1>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Ticket ID</p>
                <p style={{ fontWeight: '700', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  #{ticket._id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            {ticket.project && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                Project: {ticket.project}
              </div>
            )}

            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {ticket.description}
            </p>

            {ticket.attachments?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Paperclip size={16} /> Attachments ({ticket.attachments.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {ticket.attachments.map((file, i) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename);
                    const fileUrl = `${API_BASE_URL}${file.path}`;
                    
                    return (
                      <div key={i} className="glass-card" style={{ padding: '0.75rem', position: 'relative', overflow: 'hidden' }}>
                        {isImage ? (
                          <div style={{ height: '100px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
                            <img 
                              src={fileUrl} 
                              alt={file.filename} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => window.open(fileUrl, '_blank')}
                            />
                          </div>
                        ) : (
                          <div style={{ height: '100px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', marginBottom: '0.75rem' }}>
                            <FileText size={32} color="var(--text-muted)" />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.filename}
                          </p>
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn btn-outline" 
                            style={{ fontSize: '0.7rem', padding: '0.3rem', width: '100%', textAlign: 'center', justifyContent: 'center' }}
                          >
                            View / Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
              Activity & Comments ({comments.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No comments yet. Be the first to respond.
                </p>
              ) : (
                comments.map(comment => (
                  <CommentBubble key={comment._id} comment={comment} currentUserId={user._id} />
                ))
              )}
            </div>

            <form onSubmit={handleAddComment}>
              <div style={{ position: 'relative' }}>
                <textarea
                  placeholder="Add a comment or update…"
                  required rows="3"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  style={{ paddingRight: '56px', marginBottom: 0, resize: 'vertical' }}
                  onKeyDown={e => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      handleAddComment(e); 
                    } 
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !newComment.trim()}
                  style={{ position: 'absolute', right: '8px', bottom: '8px', padding: '0.45rem 0.6rem' }}
                >
                  <Send size={16} />
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Press Enter to send, Shift + Enter for new line</p>
            </form>
          </div>
        </div>

        {/* RIGHT — Meta panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Ticket Info */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Ticket Info</h4>
            <InfoRow label="Status" value={statusCfg.label} valueStyle={{ color: statusCfg.color }} />
            <InfoRow label="Type" value={ticket.type?.charAt(0).toUpperCase() + ticket.type?.slice(1)} />
            <InfoRow label="Category" value={ticket.category || 'General'} />
            <InfoRow label="Created By" value={ticket.createdBy?.name} />
            <InfoRow
              label="Assigned To"
              value={ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
              valueStyle={{ color: ticket.assignedTo ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: ticket.assignedTo ? 'normal' : 'italic' }}
            />
            <InfoRow
              label="Created"
              value={new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            />
          </div>

          {/* SLA Tracking */}
          <div className="glass-card" style={{ padding: '1.25rem', border: isOverdue ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={15} color={isOverdue ? '#ef4444' : 'var(--text-muted)'} /> SLA Tracking
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.83rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Response Due</p>
                <p style={{ fontWeight: '600' }}>{new Date(ticket.slaResponseDue).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Resolution Due</p>
                <p style={{ fontWeight: '600', color: isOverdue ? '#ef4444' : 'var(--text-main)' }}>
                  {new Date(ticket.slaResolutionDue).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(ticket.slaResolutionDue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isOverdue && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>⚠ OVERDUE</span>}
                </p>
              </div>
            </div>
          </div>

          {/* ✅ Assign Agent — Admin / Super Admin / Team Leader */}
          {canAssign && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={15} /> Assign Agent
              </h4>
              <select
                value={ticket.assignedTo?._id || ''}
                onChange={e => updateTicket({ assignedTo: e.target.value || null })}
                style={{ marginBottom: 0 }}
              >
                <option value="">Unassigned</option>
                {isAdmin ? employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.role.replace('_', ' ')})
                  </option>
                )) : projectInfo?.teamMembers?.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Claim Ticket — Employee */}
          {isEmployee && !ticket.assignedTo && (
            <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid rgba(99,102,241,0.3)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>This ticket is unassigned.</p>
              <button
                onClick={() => updateTicket({ assignedTo: user._id })}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Claim Ticket
              </button>
            </div>
          )}

          {/* Assigned to me — Employee */}
          {isEmployee && isAssignedToMe && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={15} color="#6ee7b7" />
              <span style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: '500' }}>Assigned to you</span>
            </div>
          )}

          {/* Priority Update — Admin / Employee */}
          {canManage && ticket.status !== 'completed' && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Update Priority</h4>
              <select
                value={ticket.priority}
                onChange={e => updateTicket({ priority: e.target.value })}
                style={{ marginBottom: 0 }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}




        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={handleDeleteTicket}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? All comments and tracking history will be permanently removed."
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TicketDetail;