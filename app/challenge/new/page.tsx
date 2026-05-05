'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startChallenge } from '@/lib/api';

const THEMES = [
  { label: '健康', icon: '💊', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: '#34d399' },
  { label: 'お金', icon: '🪙', color: '#f0c040', bg: 'rgba(240,192,64,0.1)', border: '#f0c040' },
  { label: '夢', icon: '🔮', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: '#a78bfa' },
  { label: 'キャリア', icon: '📜', color: '#7dd3fc', bg: 'rgba(125,211,252,0.1)', border: '#7dd3fc' },
  { label: '人間関係', icon: '🫂', color: '#fda4af', bg: 'rgba(253,164,175,0.1)', border: '#fda4af' },
  { label: 'その他', icon: '🧪', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: '#94a3b8' },
];

function NewChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showProgress = searchParams.get('progress') === '1';
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedThemeData = THEMES.find(t => t.label === selectedTheme);
  const canStart = goal.trim().length > 0;

  async function handleStart() {
    if (!canStart) return;
    setLoading(true);
    try {
      const challenge = await startChallenge(selectedTheme ?? undefined, goal.trim());
      localStorage.setItem('onboarding_done', '1');
      router.push(`/challenge/${challenge.id}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <div style={{ paddingTop: 40 }}>
      <style>{`
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .theme-btn:hover { transform:translateY(-2px); }
        .start-btn:hover { transform:translateY(-2px); }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: showProgress ? 16 : 28, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 26, color: '#2d5a3d' }}>
          やわらかの旅
        </div>
      </div>

      {showProgress && (
        <div style={{ marginBottom: 28, animation: 'fadeUp 0.45s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#f0c040', letterSpacing: '0.1em' }}>STEP 2 / 2</span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>習慣の設定</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #f0c040, #c49a20)', borderRadius: 100, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeUp 0.5s ease' }}>
        <div style={{ fontSize: 48, animation: 'float 3s ease-in-out infinite', display: 'inline-block', marginBottom: 12 }}>🌿</div>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 19, color: '#2c2416', marginBottom: 8 }}>
          7日間、小さく続けてみよう
        </div>
        <p style={{ fontSize: 14, color: '#7a7060', lineHeight: 1.8, margin: 0 }}>
          できなくても大丈夫。<br />ここに記録するだけでいいです。
        </p>
      </div>

      {/* リアプレイ猿の予告バナー */}
      <div style={{ background: 'rgba(30,45,74,0.8)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 14, padding: '12px 16px', marginBottom: 20, animation: 'fadeUp 0.55s ease', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flexShrink: 0 }}><img src="https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/hari.png" width={40} height={40} alt="" style={{ borderRadius: 8 }} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#a78bfa', fontFamily: 'Cinzel, serif', letterSpacing: '0.08em', marginBottom: 3 }}>リアプレイ猿より</div>
          <div style={{ fontSize: 12, color: '#c4a8f0', fontFamily: 'Nunito, sans-serif', fontWeight: 700, lineHeight: 1.6 }}>7日後、修行の結果を届けに来るぞ。<br />楽しみにしておけ。</div>
        </div>
      </div>

      {/* テーマ選択 */}
      <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 14, animation: 'fadeUp 0.6s ease', border: '1px solid #d4cabb', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 13, color: '#4a7c59', marginBottom: 14, fontWeight: 600 }}>
          カテゴリ <span style={{ fontSize: 11, fontFamily: 'Nunito, sans-serif', color: '#94a3b8', fontWeight: 600 }}>（任意）</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {THEMES.map(t => (
            <button key={t.label} className="theme-btn" onClick={() => setSelectedTheme(selectedTheme === t.label ? null : t.label)} style={{ padding: '14px 6px', borderRadius: 14, border: `1.5px solid ${selectedTheme === t.label ? t.border : '#2d3f5a'}`, background: selectedTheme === t.label ? t.bg : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: selectedTheme === t.label ? `0 4px 14px ${t.bg}` : 'none' }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: selectedTheme === t.label ? t.color : '#94a3b8' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 目標入力 */}
      <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, animation: 'fadeUp 0.65s ease', border: '1px solid #d4cabb', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 13, color: '#4a7c59', marginBottom: 4, fontWeight: 600 }}>
          7日間の目標 <span style={{ fontSize: 11, fontFamily: 'Nunito, sans-serif', color: '#f87171', fontWeight: 700 }}>必須</span>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 12 }}>
          例：毎朝ランニング30分、英単語を10個覚える
        </div>
        <input
          value={goal}
          onChange={e => setGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
          placeholder="具体的な目標を入力"
          maxLength={40}
          style={{ width: '100%', padding: '14px 16px', border: `1.5px solid ${canStart ? (selectedThemeData?.border ?? '#34d399') : '#2d3f5a'}`, borderRadius: 12, fontSize: 15, fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#2c2416', background: '#fafaf8', transition: 'all 0.15s', boxSizing: 'border-box' as const, outline: 'none' }}
        />
        <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', fontWeight: 700, marginTop: 6 }}>{goal.length}/40</div>
      </div>

      <button onClick={handleStart} disabled={!canStart || loading} className="start-btn" style={{ width: '100%', padding: '17px', borderRadius: 16, border: 'none', background: (!canStart || loading) ? '#e8e2d8' : '#4a7c59', color: (!canStart || loading) ? '#a09888' : '#ffffff', fontFamily: 'Cinzel, serif', fontSize: 17, fontWeight: 700, cursor: (!canStart || loading) ? 'not-allowed' : 'pointer', boxShadow: (!canStart || loading) ? 'none' : '0 4px 0 #2d5a3d, 0 0 20px rgba(74,124,89,0.2)', transition: 'all 0.15s', animation: 'fadeUp 0.7s ease', letterSpacing: '0.05em' }}>
        {loading ? '準備中...' : selectedThemeData ? `${selectedThemeData.icon} 始める` : 'はじめる'}
      </button>
    </div>
  );
}

export default function NewChallengePage() {
  return <Suspense><NewChallengeForm /></Suspense>;
}
