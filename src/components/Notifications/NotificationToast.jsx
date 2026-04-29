import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertCircle, Info, TriangleAlert, 
  Trash2, X, RefreshCw, Eye, ExternalLink, ArrowRight
} from 'lucide-react';

const CONFIGS = {
  success: {
    title: 'Action Successful',
    msg: 'Your request has been completed successfully. Everything looks good.',
    icon: CheckCircle2,
    color: '#10b981',
    duration: 4000,
    actions: [{ label: 'View', icon: Eye }, { label: 'Dismiss', isClose: true }]
  },
  error: {
    title: 'Execution Failed',
    msg: 'We encountered an error while processing your request. Please try again.',
    icon: AlertCircle,
    color: '#ef4444',
    duration: 5000,
    actions: [{ label: 'Retry', icon: RefreshCw }, { label: 'Dismiss', isClose: true }]
  },
  warning: {
    title: 'Attention Required',
    msg: 'This action might affect important system data. Please proceed with caution.',
    icon: TriangleAlert,
    color: '#f59e0b',
    duration: 4500,
    actions: [{ label: 'Proceed', icon: ArrowRight }, { label: 'Cancel', isClose: true }]
  },
  info: {
    title: 'System Update',
    msg: 'New features are available in version 2.1.0. Check out the latest changes.',
    icon: Info,
    color: '#6366f1',
    duration: 4000,
    actions: [{ label: 'View Details', icon: ExternalLink }, { label: 'Later', isClose: true }]
  },
  delete: {
    title: 'Deleted Successfully',
    msg: 'The item has been permanently removed from the system.',
    icon: Trash2,
    color: '#f43f5e',
    duration: 3500,
    actions: [{ label: 'Undo', icon: RefreshCw }, { label: 'OK', isClose: true }]
  }
};

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleShow = (e) => {
      const { type = 'info', message, title } = e.detail;
      const id = Date.now();
      const config = CONFIGS[type] || CONFIGS.info;

      const newToast = {
        id,
        type,
        title: title || config.title,
        message: message || config.msg,
        config,
        removing: false
      };

      setToasts(prev => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, config.duration);
    };

    window.addEventListener('show-notification', handleShow);
    return () => window.removeEventListener('show-notification', handleShow);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  return (
    <div className="notif-stack">
      {toasts.map((t) => {
        const Icon = t.config.icon;
        return (
          <div 
            key={t.id} 
            className={`notif type-${t.type} ${t.removing ? 'removing' : ''}`}
          >
            <div 
              className="notif-bar" 
              style={{ animationDuration: `${t.config.duration}ms` }} 
            />
            <div className="notif-inner">
              <div className="notif-icon-wrap">
                <Icon size={20} color={t.config.color} strokeWidth={2.5} />
              </div>
              <div className="notif-text">
                <div className="notif-title">{t.title}</div>
                <div className="notif-msg">{t.message}</div>
                <div className="notif-actions">
                  {t.config.actions.map((act, i) => (
                    <button 
                      key={i}
                      className="nact-btn"
                      style={{ 
                        background: act.isClose ? 'var(--glass)' : `${t.config.color}20`,
                        color: act.isClose ? 'var(--text-muted)' : t.config.color
                      }}
                      onClick={() => removeToast(t.id)}
                    >
                      {act.icon && <act.icon size={12} style={{ marginRight: '4px', display: 'inline' }} />}
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
              <button className="notif-close" onClick={() => removeToast(t.id)}>
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;
