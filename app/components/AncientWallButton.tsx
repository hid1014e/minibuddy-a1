'use client';

import { useRouter } from 'next/navigation';

interface AncientWallButtonProps {
  challengeId: string;
  className?: string;
}

export default function AncientWallButton({ challengeId, className = '' }: AncientWallButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/walls/${challengeId}`)}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 22px',
        background: 'linear-gradient(135deg, #2a2118 0%, #3d2e1e 40%, #2a2118 100%)',
        border: '1px solid #6b5a3e',
        borderRadius: '4px',
        cursor: 'pointer',
        color: '#c9a96e',
        fontFamily: "'Cinzel', serif",
        fontSize: '13px',
        letterSpacing: '0.08em',
        width: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(201,169,110,0.15), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <rect x="2" y="1" width="20" height="22" rx="1" fill="#4a3520" stroke="#8a6c42" strokeWidth="1.2"/>
        <line x1="12" y1="1" x2="12" y2="23" stroke="#6b5030" strokeWidth="1"/>
        <line x1="2" y1="8" x2="22" y2="8" stroke="#6b5030" strokeWidth="0.7" strokeDasharray="2,1"/>
        <line x1="2" y1="16" x2="22" y2="16" stroke="#6b5030" strokeWidth="0.7" strokeDasharray="2,1"/>
        <circle cx="9.5" cy="12" r="1.2" fill="none" stroke="#c9a96e" strokeWidth="1.2"/>
        <circle cx="14.5" cy="12" r="1.2" fill="none" stroke="#c9a96e" strokeWidth="1.2"/>
        <path d="M6 4 Q12 2 18 4" stroke="#8a6c42" strokeWidth="0.8" fill="none"/>
      </svg>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.12em', fontWeight: 600 }}>
          古代壁画を覗く
        </span>
        <span style={{ fontSize: '10px', color: '#8a7050', letterSpacing: '0.06em', fontFamily: 'Nunito, sans-serif', marginTop: '1px' }}>
          みんなの修行の記録
        </span>
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', opacity: 0.5 }}>
        <path d="M9 18l6-6-6-6" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
