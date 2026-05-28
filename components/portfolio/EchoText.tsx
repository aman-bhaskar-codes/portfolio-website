import React from 'react';

export function EchoText({
  children,
  tag: Tag = 'h1',
  className = '',
}: {
  children: React.ReactNode;
  tag?: any;
  className?: string;
}) {
  return (
    <div className={`echo-wrap ${className}`} style={{ position: 'relative', display: 'inline-block', overflow: 'visible' }}>
      <Tag className="echo-real" style={{ position: 'relative', zIndex: 1, color: 'white' }}>{children}</Tag>
      <Tag className="echo-ghost" aria-hidden="true" style={{
        position: 'absolute',
        left: '0.04em',
        top: '0.04em',
        color: 'transparent',
        WebkitTextStroke: '1px rgba(255,255,255,0.07)',
        pointerEvents: 'none',
        zIndex: 0,
        willChange: 'transform',
        width: '100%'
      }}>{children}</Tag>
    </div>
  );
}
