import React from 'react';

const PoweredByThemidnight = ({ size = 'md', align = 'center' }) => {
  const fontSize = size === 'sm' ? '0.72rem' : size === 'lg' ? '0.88rem' : '0.78rem';
  return (
    <div
      className="tm-powered"
      style={{
        justifyContent: align,
        display: align === 'center' ? 'inline-flex' : 'flex',
        fontSize,
      }}
    >
      <span className="tm-dot" />
      <span>Powered by</span>
      <a
        href="https://themidnight.in/"
        target="_blank"
        rel="noopener noreferrer"
        title="themidnight"
      >
        themidnight
      </a>
    </div>
  );
};

export default PoweredByThemidnight;
