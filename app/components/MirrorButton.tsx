'use client';

import { useState } from 'react';

const MIRROR_DATA = {
  キャラクター: [
    { icon: '🦁', name: 'レオ総裁', desc: '「もっとパレスなお屋敷」に住む案内人。' },
    { icon: '🐵', name: 'リアプレイ猿', desc: '1週間の振り返り時、出現。' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
  ],
  アイテム: [
    { icon: '🧹', name: 'イチジホウキ', desc: '早期登録、初回特典アイテム。' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
  ],
  黒魔術: [
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
  ],
  称号: [
    { icon: '🦸', name: 'カムバック・ヒーロー', desc: '適度な休息をすると贈られるミニ称号。' },
    { icon: '？', name: '？？？', desc: '' },
    { icon: '？', name: '？？？', desc: '' },
  ],
};

const SECTION_ICON: Record<string, string> = {
  キャラクター: '🎭',
  アイテム: '✨',
  黒魔術: '🌑',
  称号: '🏅',
};

export default function MirrorButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: '#1a1230',
          border: '1px solid #6b4fa0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          zIndex: 40,
          boxShadow: '0 0 0 1px rgba(107,79,160,0.3)',
        }}
        title="未来を映す鏡"
      >
        🪞
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,4,20,0.82)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0e0920',
              border: '1px solid #3d2a6b',
              borderBottom: 'none',
              borderRadius: '20px 20px 0 0',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '88vh',
              overflowY: 'auto',
              paddingBottom: '32px',
            }}
          >
            <div style={{
              position: 'sticky', top: 0, background: '#0e0920',
              borderBottom: '1px solid #2a1a4a', padding: '16px 20px 14px',
              display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1,
            }}>
              <span style={{ fontSize: '22px' }}>🪞</span>
              <span style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: '16px', color: '#d4b8ff', letterSpacing: '0.04em', flex: 1 }}>
                未来を映す鏡
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#1e1238', border: '1px solid #3d2a6b',
                  color: '#9980cc', fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            <p style={{ padding: '10px 20px 4px', fontSize: '11px', color: '#6b5590', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Hagrit の世界に訪れるもの
            </p>

            {(Object.entries(MIRROR_DATA) as [string, { icon: string; name: string; desc: string }[]][]).map(([section, items], si) => (
              <div key={section}>
                {si > 0 && <div style={{ height: '1px', background: '#1e1238', margin: '4px 16px' }} />}
                <div style={{ padding: '4px 16px 8px' }}>
                  <div style={{
                    fontSize: '10px', color: '#5a4480', letterSpacing: '0.12em',
                    textTransform: 'uppercase', padding: '10px 4px 6px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span>{SECTION_ICON[section]}</span>
                    <span style={{ width: '8px', height: '1px', background: '#3d2a6b', display: 'inline-block', flexShrink: 0 }} />
                    {section}
                    <span style={{ flex: 1, height: '1px', background: '#3d2a6b', display: 'inline-block' }} />
                  </div>

                  {items.map((item, i) => {
                    const isLocked = item.name === '？？？';
                    const iconBg =
                      isLocked ? { background: '#151020', border: '1px solid #2a1a4a' } :
                      section === 'アイテム' ? { background: '#1a1500', border: '1px solid #5a4200' } :
                      section === '黒魔術' ? { background: '#0a1a0a', border: '1px solid #1a4a1a' } :
                      section === '称号' ? { background: '#1a0a10', border: '1px solid #5a1a2a' } :
                      { background: '#1d1040', border: '1px solid #4a3480' };

                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '10px 12px', borderRadius: '10px', margin: '2px 0',
                        opacity: isLocked ? 0.45 : 1,
                      }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: isLocked ? '14px' : '17px',
                          color: isLocked ? '#5a4480' : undefined,
                          ...iconBg,
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', color: isLocked ? '#4a3a6a' : '#c4a8f0', fontWeight: 500, lineHeight: 1.3 }}>
                            {item.name}
                          </div>
                          {item.desc ? (
                            <div style={{ fontSize: '11px', color: '#7a6090', lineHeight: 1.5, marginTop: '2px' }}>
                              {item.desc}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <p style={{ textAlign: 'center', fontSize: '10px', color: '#3d2a5a', padding: '16px 20px 0', letterSpacing: '0.04em' }}>
              🔮 鏡は時折、新たな未来を映し出す
            </p>
          </div>
        </div>
      )}
    </>
  );
}
