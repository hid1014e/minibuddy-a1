'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createProfile, getProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

function NicknameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uidParam = searchParams.get('uid') ?? '';
  const next = searchParams.get('next') ?? '/challenge/new';
  const showProgress = searchParams.get('progress') === '1';
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(uidParam);

  useEffect(() => {
    async function check() {
      let uid = uidParam;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          uid = user.id;
        } else {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error || !data.user) return;
          uid = data.user.id;
        }
        setUserId(uid);
      }
      const profile = await getProfile(uid);
      if (profile) { router.replace(next); return; }
      setLoading(false);
    }
    check();
  }, [uidParam, next, router]);

  async function handleSubmit() {
    if (!nickname.trim()) { setError('名前を入力してください'); return; }
    if (nickname.length > 10) { setError('10文字以内で入力してください'); return; }
    setLoading(true);
    try {
      await createProfile(userId, nickname.trim());
      router.replace(next);
    } catch {
      setError('エラーが発生しました。もう一度試してください。');
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 26, color: '#2d5a3d', marginBottom: 12 }}>やわらかの旅</div>
        <div style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700 }}>読み込み中...</div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 60 }}>
      <style>{`
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: showProgress ? 16 : 32, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 26, color: '#2d5a3d' }}>やわらかの旅</div>
      </div>

      {showProgress && (
        <div style={{ marginBottom: 28, animation: 'fadeUp 0.45s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#f0c040', letterSpacing: '0.1em' }}>STEP 1 / 2</span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>ニックネーム</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '50%', background: 'linear-gradient(90deg, #f0c040, #c49a20)', borderRadius: 100, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeUp 0.5s ease' }}>
        <div style={{ animation: 'float 3s ease-in-out infinite', display: 'inline-block', marginBottom: 14 }}>
          <img src="https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/sun.png" alt="" style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.4))' }} />
        </div>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 18, color: '#2c2416', marginBottom: 8 }}>ようこそ。</div>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>
          仲間に表示されるニックネームを<br />決めてください（10文字以内）
        </p>
      </div>

      <div style={{ background: '#1e2d4a', borderRadius: 20, padding: 24, border: '1px solid #2d3f5a', animation: 'fadeUp 0.6s ease' }}>
        <label style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#f0c040', display: 'block', marginBottom: 10, letterSpacing: '0.05em' }}>ニックネーム</label>
        <input
          value={nickname}
          onChange={e => { setNickname(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="例：たろう、shadow_cat"
          maxLength={10}
          style={{ width: '100%', padding: '14px 16px', border: `1.5px solid ${error ? '#f87171' : '#2d3f5a'}`, borderRadius: 12, fontSize: 16, fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#f1f5f9', background: '#0f1729', transition: 'all 0.15s', marginBottom: 6, boxSizing: 'border-box' as const, outline: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700 }}>{error}</span>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{nickname.length}/10</span>
        </div>
        <button onClick={handleSubmit} disabled={!nickname.trim()} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: !nickname.trim() ? '#1e2d4a' : 'linear-gradient(135deg, #f0c040, #c49a20)', color: !nickname.trim() ? '#2d3f5a' : '#0f1729', fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 700, cursor: !nickname.trim() ? 'not-allowed' : 'pointer', boxShadow: !nickname.trim() ? 'none' : '0 5px 0 #8a6000, 0 0 20px rgba(240,192,64,0.3)', transition: 'all 0.15s', letterSpacing: '0.05em' }}>
          はじめる ✦
        </button>
      </div>
    </div>
  );
}

export default function NicknamePage() {
  return <Suspense><NicknameForm /></Suspense>;
}
