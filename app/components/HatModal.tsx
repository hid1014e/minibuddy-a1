'use client';

import { useState } from 'react';

function GuideStep({ num, text }: { num: number; text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 16px',
      background: 'rgba(201,168,76,0.06)',
      border: '1px solid rgba(201,168,76,0.15)',
      borderRadius: 12,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'rgba(201,168,76,0.15)',
        border: '1px solid rgba(201,168,76,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cinzel, serif', fontSize: 11, color: '#c9a84c', flexShrink: 0,
      }}>{num}</div>
      <p style={{
        fontFamily: 'Nunito, sans-serif', fontSize: 13,
        color: 'rgba(232,217,176,0.85)', lineHeight: 1.7, margin: 0,
      }}>{text}</p>
    </div>
  );
}

function detectEnv(): 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'android-other' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  const isChromeIOS = /CriOS/.test(ua);
  const isChromeAndroid = isAndroid && /Chrome/.test(ua) && !/EdgA/.test(ua);

  if (isIOS && isSafari) return 'ios-safari';
  if (isIOS && isChromeIOS) return 'ios-chrome';
  if (isChromeAndroid) return 'android-chrome';
  if (isAndroid) return 'android-other';
  return 'desktop';
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function HatModal({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState<'modal' | 'guide'>('modal');
  const [copied, setCopied] = useState(false);
  const siteUrl = 'https://minibuddy.vercel.app';
  const env = detectEnv();

  async function handleCopy() {
    const ok = await copyToClipboard(siteUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // ── ガイド画面 ──
  if (step === 'guide') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(6,3,18,0.97)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        animation: 'hatFadeUp 0.3s ease',
      }}>
        <style>{`@keyframes hatFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: 'rgba(240,192,64,0.45)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 14 }}>保存方法の手引き</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 19, color: '#f0c040', textAlign: 'center', marginBottom: 24, lineHeight: 1.6, textShadow: '0 0 20px rgba(240,192,64,0.35)' }}>
          迷子防止🧙の被り方
        </div>

        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {env === 'ios-safari' && (<>
            <GuideStep num={1} text='画面右下の … をタップ' />
            <GuideStep num={2} text='共有マーク（四角と上向き矢印）をタップ' />
            <GuideStep num={3} text='メニューを下にスクロールして「ホーム画面に追加」を選ぶ' />
            <GuideStep num={4} text='名前を「Hagrit」にして右上「追加」で完了！' />
          </>)}
          {env === 'ios-chrome' && (<>
            <GuideStep num={1} text='画面右下の … をタップ' />
            <GuideStep num={2} text='「ホーム画面に追加」を選ぶ' />
            <GuideStep num={3} text='名前を「Hagrit」にして「追加」で完了！' />
          </>)}
          {env === 'android-chrome' && (<>
            <GuideStep num={1} text='画面右上の ⋮ をタップ' />
            <GuideStep num={2} text='「ホーム画面に追加」または「アプリをインストール」を選ぶ' />
            <GuideStep num={3} text='名前を「Hagrit」にして「追加」で完了！' />
          </>)}
          {(env === 'android-other' || env === 'desktop') && (<>
            <GuideStep num={1} text='アドレスバー右の ☆ をクリック（または Ctrl+D、Mac は Cmd+D）' />
            <GuideStep num={2} text='名前を「Hagrit」にして「完了」で保存' />
            <GuideStep num={3} text='次回からブックマークバーのワンクリックで戻れます！' />
          </>)}
        </div>

        {/* URLコピー */}
        <div style={{
          width: '100%', maxWidth: 340, marginBottom: 20,
          padding: '14px 16px',
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: 'rgba(232,217,176,0.5)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{siteUrl}</span>
          <button onClick={handleCopy} style={{
            padding: '7px 14px', borderRadius: 8,
            background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(201,168,76,0.15)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(201,168,76,0.35)'}`,
            color: copied ? '#34d399' : '#c9a84c',
            fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
          }}>
            {copied ? '✦ コピー済' : 'URLをコピー'}
          </button>
        </div>

        <button onClick={onDismiss} style={{
          width: '100%', maxWidth: 340, padding: '14px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #c9a84c, #8a6820)',
          border: 'none', color: '#0e0b1a',
          fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 0 20px rgba(201,168,76,0.35)',
        }}>✦ 了解、準備完了</button>
      </div>
    );
  }

  // ── メインモーダル ──
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(6,3,18,0.94)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      animation: 'hatFadeUp 0.35s ease',
    }}>
      <style>{`@keyframes hatFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{
        width: '100%', maxWidth: 340,
        background: 'linear-gradient(160deg, rgba(201,168,76,0.10), rgba(14,8,2,0.97))',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 24, padding: '36px 28px',
        boxShadow: '0 0 60px rgba(201,168,76,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 50, marginBottom: 6, filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.5))', lineHeight: 1 }}>🧙</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: 'rgba(240,192,64,0.45)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 18 }}>迷子防止</div>

        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 17, color: '#e8d9b0',
          textAlign: 'center', lineHeight: 1.7, marginBottom: 18,
        }}>
          修行、お見事でした。
        </div>

        <div style={{
          width: '100%', padding: '16px 18px',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(201,168,76,0.12)',
          borderRadius: 14, marginBottom: 10,
        }}>
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontSize: 13,
            color: 'rgba(232,217,176,0.78)', lineHeight: 1.95, margin: 0, textAlign: 'center',
          }}>
            ただ、一度この島を離れると<br />
            日常という深い迷宮の中で<br />
            入り口を見失ってしまうかもしれません。<br /><br />
            明日も迷わず戻れるよう、<br />
            <span style={{ color: '#f0c040', fontWeight: 800 }}>「迷子防止🧙」</span>を被っておきませんか？
          </p>
        </div>

        {/* URLコピー（メインモーダルにも常設） */}
        <div style={{
          width: '100%', marginBottom: 18,
          padding: '11px 14px',
          background: 'rgba(201,168,76,0.05)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: 'rgba(232,217,176,0.4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{siteUrl}</span>
          <button onClick={handleCopy} style={{
            padding: '6px 12px', borderRadius: 8,
            background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(201,168,76,0.12)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(201,168,76,0.3)'}`,
            color: copied ? '#34d399' : '#c9a84c',
            fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800,
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
          }}>
            {copied ? '✦ コピー済' : 'URLをコピー'}
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => setStep('guide')} style={{
            width: '100%', padding: '14px 12px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #c9a84c, #8a6820)',
            border: 'none', color: '#0e0b1a',
            fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 0 #4a2e08, 0 0 20px rgba(201,168,76,0.25)',
            lineHeight: 1.6,
          }}>
            🧙 迷子防止を被る
            <br />
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>（ホーム画面への追加方法を見る）</span>
          </button>
          <button onClick={onDismiss} style={{
            width: '100%', padding: '12px',
            borderRadius: 12,
            background: 'transparent',
            border: '1px solid rgba(201,168,76,0.15)',
            color: 'rgba(232,217,176,0.35)',
            fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>
            今はいい（迷宮を歩く）
          </button>
        </div>
      </div>
    </div>
  );
}
