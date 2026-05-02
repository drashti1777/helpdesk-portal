import API_BASE_URL from '../../config';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Bell, X, Check, Clock, Info, Trash2, Globe } from 'lucide-react';
import ConfirmModal from '../Layout/ConfirmModal';

const NotificationPanel = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-notifications', handleToggle);
    return () => window.removeEventListener('toggle-notifications', handleToggle);
  }, []);

  useEffect(() => {
    if (!user?.token) return;

    const fetchAndToast = async (isInitial = false) => {
      setLoading(isInitial);
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const data = await res.json();
        const currentNotifications = Array.isArray(data) ? data : [];

        if (!isInitial) {
          setNotifications(prev => {
            const newUnread = currentNotifications.filter(n => !n.isRead && !prev.find(existing => existing._id === n._id));
            newUnread.forEach(n => {
              window.dispatchEvent(new CustomEvent('show-notification', { detail: { notification: n } }));
            });
            return currentNotifications;
          });
        } else {
          setNotifications(currentNotifications);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndToast(true);
    const interval = setInterval(() => fetchAndToast(false), 30000);
    return () => clearInterval(interval);
  }, [user?.token, logout, navigate]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    setShowClearConfirm(false);
    try {
      await fetch(`${API_BASE_URL}/api/notifications/clear-all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSingle = async () => {
    const { id } = deleteConfirm;
    if (!id) return;
    setDeleteConfirm({ isOpen: false, id: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markAsRead(n._id);
    const ticketId = typeof n.ticketId === 'string' ? n.ticketId : n.ticketId?._id;
    if (ticketId) {
      navigate(`/tickets/${ticketId}`);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { count: unreadCount } }));
  }, [notifications]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000, backdropFilter: 'blur(2px)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '420px', height: '100%',
        background: 'var(--bg-dark)', borderLeft: '1px solid var(--border)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={18} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Notifications</h2>
              {unreadCount > 0 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '600' }}>{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => notifications.length > 0 && markAllRead()}
              className="btn btn-outline"
              disabled={notifications.length === 0}
              style={{
                padding: '0.35rem 0.6rem',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: notifications.length > 0 ? 'var(--text-main)' : 'var(--text-muted)',
                opacity: notifications.length === 0 ? 0.6 : 1,
                cursor: notifications.length === 0 ? 'not-allowed' : 'pointer'
              }}
              title="Mark all as read"
            >
              <Check size={13} /> Read All
            </button>
            <button
              onClick={() => notifications.length > 0 && setShowClearConfirm(true)}
              className="btn btn-outline"
              disabled={notifications.length === 0}
              style={{
                padding: '0.35rem 0.6rem',
                fontSize: '0.7rem',
                color: notifications.length > 0 ? '#fca5a5' : 'var(--text-muted)',
                borderColor: 'rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                opacity: notifications.length === 0 ? 0.6 : 1,
                cursor: notifications.length === 0 ? 'not-allowed' : 'pointer'
              }}
              title="Clear all"
            >
              <Trash2 size={13} /> Clear All
            </button>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.25rem' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Bell size={40} style={{ opacity: 0.15, marginBottom: '1rem' }} />
              <p style={{ fontWeight: '500' }}>No notifications yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>You'll be notified when something happens.</p>
            </div>
          ) : (
            notifications.map((n, idx) => (
              <div
                key={n._id}
                style={{
                  padding: '0.85rem 1rem', borderRadius: '12px',
                  background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.05)',
                  border: `1px solid ${n.isRead ? 'var(--border)' : 'rgba(99,102,241,0.2)'}`,
                  marginBottom: '0.6rem', transition: 'all 0.2s',
                  position: 'relative',
                  animation: `fadeIn 0.3s ease ${idx * 0.03}s both`
                }}
              >
                {/* Unread dot */}
                {!n.isRead && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 6px rgba(99,102,241,0.4)' }} />
                )}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div
                    style={{ flexShrink: 0, marginTop: '2px', marginLeft: !n.isRead ? '0.75rem' : '0', cursor: 'pointer' }}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: n.type === 'ticket_update' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {n.type === 'ticket_update' ? <Clock size={15} color="#f59e0b" /> : <Info size={15} color="#6366f1" />}
                    </div>
                  </div>
                  <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={() => handleNotificationClick(n)}>
                    <p style={{ fontSize: '0.85rem', fontWeight: n.isRead ? '400' : '600', color: 'var(--text-main)', marginBottom: '0.25rem', lineHeight: 1.4 }}>
                      {n.message || 'System Notification'}
                    </p>
                    {n.projectName && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        <Globe size={10} /> {n.projectName}
                      </div>
                    )}
                    {n.activityDetails && n.activityDetails !== n.message && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontStyle: 'italic' }}>
                        {n.activityDetails}
                      </p>
                    )}
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, id: n._id }); }}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', padding: '0.3rem', borderRadius: '6px',
                      transition: 'all 0.2s', flexShrink: 0, marginTop: '2px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {notifications.length} notification{notifications.length > 1 ? 's' : ''} · {unreadCount} unread
            </p>
          </div>
        )}
      </div>

      {/* Confirm Modal — Clear All */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onConfirm={clearAll}
        onCancel={() => setShowClearConfirm(false)}
        title="Clear All Notifications"
        message="Are you sure you want to clear all notifications? This action cannot be undone."
        confirmText="Clear All"
      />

      {/* Confirm Modal — Delete Single */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={deleteSingle}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmText="Delete"
      />

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default NotificationPanel;
