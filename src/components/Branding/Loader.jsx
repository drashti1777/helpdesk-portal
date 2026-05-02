import React from 'react';

const Loader = ({ label = 'Loading', fullscreen = false, size = 'md' }) => {
  const dim = size === 'sm' ? 36 : size === 'lg' ? 72 : 56;

  const wrap = (
    <div className="tm-loader-wrap">
      <div className="tm-loader" style={{ width: dim, height: dim }} />
      {label ? <div className="tm-loader-label">{label}</div> : null}
    </div>
  );

  if (!fullscreen) return wrap;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-page)',
      }}
    >
      {wrap}
    </div>
  );
};

export default Loader;
