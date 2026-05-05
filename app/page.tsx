'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveChallenge, getProfile, shouldShowIchijiBroom, grantIchijiBroom } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [showBroom, setShowBroom] = useState(false);
  const [broomReceived, setBroomReceived] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function init() {
      console.log('① init開始');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('② user=', user?.id ?? 'null');

      const done = localStorage.getItem('onboarding_done');
      console.log('③ onboarding_done=', done);
      if (!done) {
        if (!user) {
          // 本当に新規ユーザーのみ2択オンボーディング
          const { error } = await supabase.auth.signInAnonymously();
          if (error) return;
          setShowOnboarding(true);
          return;
        }
        // userはいるがprofileがない＝セットアップ未完了 → 2択オンボーディングへ
        const profileCheck = await getProfile(user.id);
        if (!profileCheck) {
          setShowOnboarding(true);
          return;
        }
        // userもprofileもある＝既存ユーザー → localStorageを修復して通常ルートへ
        // quick-start保存中は介入しない
        if (localStorage.getItem('qs_in_progress')) {
          console.log('③ qs_in_progress中 → skip');
          return;
        }
        localStorage.setItem('onboarding_done', '1');
      }

      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) return;
        router.replace(`/nickname?uid=${data.user.id}&next=${encodeURIComponent('/challenge/new')}`);
        return;
      }

      console.log('④ getProfile前');
      const profile = await getProfile(user.id);
      console.log('⑤ profile=', profile ? 'あり' : 'なし');
      if (!profile) {
        const challenge = await getActiveChallenge();
        const next = challenge ? `/challenge/${challenge.id}` : '/challenge/new';
        router.replace(`/nickname?uid=${user.id}&next=${encodeURIComponent(next)}`);
        return;
      }

      console.log('⑥ getActiveChallenge前');
      const challenge = await getActiveChallenge();
      console.log('⑦ challenge=', challenge?.id ?? 'なし');
      const target = challenge ? `/challenge/${challenge.id}` : '/challenge/new';

      console.log('⑧ shouldShowIchijiBroom前');
      let show = false;
      try {
        const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000));
        show = await Promise.race([shouldShowIchijiBroom(user), timeout]);
      } catch {
        show = false;
      }
      console.log('⑨ show=', show, 'target=', target);
      if (show) {
        try { await grantIchijiBroom(); } catch {}
        setRedirectTarget(target);
        setShowBroom(true);
      } else {
        console.log('⑩ router.replace直前');
        router.replace(target);
        console.log('⑪ router.replace後');
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleReceiveBroom() {
    setBroomReceived(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ichiji_broom_received', '1');
    }
    setTimeout(() => {
      if (redirectTarget) router.replace(redirectTarget);
    }, 800);
  }

  // 2択オンボーディング画面
  if (showOnboarding) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#f7f3ed',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes leafSway {
            0%,100% { opacity: 0.25; transform: rotate(-8deg); }
            50% { opacity: 0.5; transform: rotate(8deg); }
          }
        `}</style>

        {['8%,12%','88%,18%','4%,72%','92%,68%','48%,6%'].map((pos, i) => {
          const [left, top] = pos.split(',');
          return (
            <div key={i} style={{
              position: 'absolute', left, top,
              fontSize: ['18px','14px','20px','12px','16px'][i],
              animation: `leafSway ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              color: '#4a7c59',
            }}>✿</div>
          );
        })}

        <div style={{ animation: 'fadeUp 0.6s ease', marginBottom: '6px' }}>
          <div style={{
            fontFamily: 'Lora, serif', fontSize: '30px',
            color: '#2d5a3d', letterSpacing: '0.03em',
          }}>やわらかの旅</div>
        </div>

        <div style={{
          animation: 'fadeUp 0.7s ease', marginBottom: '40px',
          fontSize: '15px', color: '#7a7060',
          fontFamily: 'Nunito, sans-serif', fontWeight: 600,
          lineHeight: 1.8,
        }}>
          5分だけ、ここにいていいですよ。<br />何かを変えようとしなくていいです。
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '14px',
          width: '100%', maxWidth: '320px',
          animation: 'fadeUp 0.8s ease',
        }}>
          {/* おすすめ：5分 */}
          <button
            onClick={() => {
              router.push('/quick-start');
            }}
            style={{
              padding: '20px 24px',
              borderRadius: '18px',
              border: '2px solid rgba(74,124,89,0.35)',
              background: 'linear-gradient(135deg, rgba(74,124,89,0.1), rgba(107,163,122,0.05))',
              color: '#2d5a3d',
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              boxShadow: '0 2px 12px rgba(74,124,89,0.1)',
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', left: '16px',
              background: '#4a7c59',
              color: '#fff', fontSize: '11px', fontWeight: 800,
              padding: '2px 10px', borderRadius: '100px',
              fontFamily: 'Nunito, sans-serif', letterSpacing: '0.03em',
            }}>おすすめ</div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: '#2d5a3d' }}>
              まずは5分だけやってみる
            </div>
            <div style={{ fontSize: '13px', color: '#6ba37a', fontWeight: 600 }}>
              タイマーを使って今すぐスタート
            </div>
          </button>

          {/* 自由設定 */}
          <button
            onClick={() => {
              router.push('/nickname?progress=1&next=' + encodeURIComponent('/challenge/new?progress=1'));
            }}
            style={{
              padding: '18px 24px',
              borderRadius: '18px',
              border: '1px solid #d4cabb',
              background: '#ffffff',
              color: '#4a4030',
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '4px' }}>
              自分で設定する
            </div>
            <div style={{ fontSize: '13px', color: '#8a8070', fontWeight: 600 }}>
              ニックネームと習慣を自分で決める
            </div>
          </button>
        </div>
      </div>
    );
  }

  // イチジホウキ画面
  if (showBroom) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#f7f3ed',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '24px',
        textAlign: 'center',
      }}>
        <style>{`
          @keyframes broomFloat {
            0%,100% { transform: translateY(0) rotate(-8deg); }
            50% { transform: translateY(-16px) rotate(8deg); }
          }
          @keyframes broomFadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes starTwinkle {
            0%,100% { opacity: 0.3; } 50% { opacity: 1; }
          }
          @keyframes goldShimmer {
            0%,100% { box-shadow: 0 0 20px rgba(240,192,64,0.3); }
            50% { box-shadow: 0 0 40px rgba(240,192,64,0.7), 0 0 80px rgba(240,192,64,0.2); }
          }
        `}</style>

        {['10%,15%','85%,20%','5%,70%','90%,65%','50%,8%'].map((pos, i) => {
          const [left, top] = pos.split(',');
          return (
            <div key={i} style={{
              position: 'absolute', left, top,
              fontSize: ['16px','12px','18px','10px','14px'][i],
              animation: `starTwinkle ${1.5 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              color: '#f0c040',
            }}>✦</div>
          );
        })}

        <div style={{
          fontSize: '12px', color: '#f0c040', fontFamily: 'Cinzel, serif',
          letterSpacing: '0.1em', marginBottom: '20px',
          animation: 'broomFadeIn 0.6s ease', opacity: 0.85,
        }}>
          🦁 レオ総裁のお屋敷より
        </div>

        <div style={{
          fontSize: '88px',
          animation: 'broomFloat 3s ease-in-out infinite, broomFadeIn 0.5s ease',
          marginBottom: '28px',
          filter: 'drop-shadow(0 0 20px rgba(240,192,64,0.5))',
        }}>🧹</div>

        <div style={{ animation: 'broomFadeIn 0.7s ease', marginBottom: '32px' }}>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: '22px',
            color: '#f0c040', marginBottom: '12px',
            textShadow: '0 0 20px rgba(240,192,64,0.5)',
            letterSpacing: '0.05em',
          }}>
            イチジホウキ
          </div>
          <div style={{
            fontSize: '14px', color: '#c4a8f0',
            fontFamily: 'Nunito, sans-serif', fontWeight: 700,
            lineHeight: 1.7, maxWidth: '280px',
          }}>
            お主の帰還を待っておったぞ。<br />
            レオ総裁のお屋敷より、<br />
            特別なホウキを授けよう。
          </div>
        </div>

        <button
          onClick={handleReceiveBroom}
          disabled={broomReceived}
          style={{
            padding: '16px 48px',
            borderRadius: '100px',
            border: 'none',
            background: broomReceived
              ? 'rgba(240,192,64,0.3)'
              : 'linear-gradient(135deg, #f0c040, #c49a20)',
            color: broomReceived ? '#f0c040' : '#0f1729',
            fontFamily: 'Cinzel, serif',
            fontSize: '16px',
            fontWeight: 800,
            cursor: broomReceived ? 'default' : 'pointer',
            animation: 'broomFadeIn 0.9s ease, goldShimmer 2s ease-in-out infinite',
            letterSpacing: '0.05em',
            minWidth: '200px',
          }}
        >
          {broomReceived ? '✦ 受け取りました' : '🧹 受け取る'}
        </button>

        <div style={{
          marginTop: '20px', fontSize: '11px',
          color: '#5a4480', fontFamily: 'Nunito, sans-serif',
          animation: 'broomFadeIn 1s ease',
        }}>
          プロフィールから確認・使用できます
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f3ed' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 26, color: '#2d5a3d', marginBottom: 12 }}>やわらかの旅</div>
        <div style={{ color: '#8a8070', fontSize: 14, fontWeight: 600 }}>よみこみ中...</div>
      </div>
    </div>
  );
}
