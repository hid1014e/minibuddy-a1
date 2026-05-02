'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDays, resetAndStartNew, getStreakWeeks, getTitle } from '@/lib/api';
import { MiniChallengeDay } from '@/lib/types';
import AncientWallButton from '@/app/components/AncientWallButton';

export default function CompletePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const [days, setDays] = useState<MiniChallengeDay[]>([]);
  const [streakWeeks, setStreakWeeks] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  const load = useCallback(async () => {
    const d = await getDays(challengeId);
    setDays(d);
    const weeks = await getStreakWeeks();
    setStreakWeeks(weeks);
  }, [challengeId]);

  useEffect(() => { load(); }, [load]);

  const doneCount = days.filter(d => d.status === 'done').length;
  const titleData = getTitle(streakWeeks);

  const hero = doneCount === 7
    ? { emoji: '🏆', color: '#f0c040', border: 'rgba(240,192,64,0.35)', bg: 'rgba(240,192,64,0.07)', badge: '7/7' }
    : doneCount >= 5
    ? { emoji: '🔮', color: '#a78bfa', border: 'rgba(167,139,250,0.35)', bg: 'rgba(167,139,250,0.07)', badge: doneCount + '/7' }
    : doneCount >= 3
    ? { emoji: '⚗️', color: '#34d399', border: 'rgba(52,211,153,0.35)', bg: 'rgba(52,211,153,0.07)', badge: doneCount + '/7' }
    : { emoji: '🌱', color: '#94a3b8', border: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.05)', badge: doneCount + '/7' };

  const monkeyLine = doneCount === 7
    ? '7日やり切ったな。習慣の入口に片足突っ込んだぞ。'
    : doneCount >= 5
    ? '週4日以上が習慣化の鍵！良い調子ですっ'
    : doneCount >= 3
    ? 'もう少しだけ目標の負荷を下げても良いかもですね！'
    : 'ウキ…始めたことは偉い。でも次はもっと頑張れよ！';

  const doneDays = days.filter(d => d.status === 'done');
  const topCategory = doneDays.length > 0 ? doneDays[doneDays.length - 1].plan : null;
  const lastDay = days.find(d => d.day_number === 7);
  const nextStep = lastDay?.next_step ?? null;

  const retryLabel = doneCount === 7 ? '✦ 次の修行へ' : '✦ もう一度チャレンジする';

  async function handleRetry() {
    await resetAndStartNew();
    router.replace('/challenge/new');
  }

  const css = [
    '@keyframes celebrate { 0% { transform:scale(0) rotate(-15deg); } 60% { transform:scale(1.25) rotate(5deg); } 100% { transform:scale(1) rotate(0deg); } }',
    '@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }',
    '@keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }',
    '@keyframes shimmer { 0%,100% { box-shadow:0 0 10px rgba(240,192,64,0.2); } 50% { box-shadow:0 0 25px rgba(240,192,64,0.5); } }',
    '@keyframes monkeyBounce { 0%,100% { transform:translateY(0) rotate(-3deg); } 50% { transform:translateY(-6px) rotate(3deg); } }',
  ].join(' ');

  return (
    <div style={{ paddingTop: 32 }}>
      <style>{css}</style>

      <div style={{ textAlign: 'center', marginBottom: 20, animation: 'fadeUp 0.3s ease' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: '#f0c040', textShadow: '0 0 20px rgba(240,192,64,0.5)' }}>Hagrit</div>
      </div>

      {/* スクショカード */}
      <div style={{ background: hero.bg, border: '1px solid ' + hero.border, borderRadius: 24, padding: '28px 20px 24px', textAlign: 'center', marginBottom: 12, animation: 'fadeUp 0.4s ease' }}>

        {/* 1: トロフィー＋大きい達成数 */}
        <div style={{ fontSize: 64, animation: 'celebrate 0.6s ease, float 3s 0.6s ease-in-out infinite', display: 'inline-block', marginBottom: 10 }}>{hero.emoji}</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 48, color: '#f1f5f9', lineHeight: 1, marginBottom: 4 }}>{hero.badge}</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: hero.color, letterSpacing: '0.08em', marginBottom: 18 }}>7日修行終了</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} style={{ fontSize: 16, opacity: i < doneCount ? 1 : 0.15, color: '#f0c040' }}>✦</span>
          ))}
        </div>

        {/* 2: 猿コメント */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(15,23,41,0.5)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, textAlign: 'left' }}>
          <img
            src="https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/monkey-wizard.png"
            alt="リアプレイ猿"
            style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0, animation: 'monkeyBounce 2s ease-in-out infinite', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
          />
          <div style={{ fontSize: 13, color: '#f1f5f9', fontFamily: 'Nunito, sans-serif', fontWeight: 700, lineHeight: 1.6 }}>{monkeyLine}</div>
        </div>

        {/* 3: 要約 */}
        <div style={{ background: 'rgba(15,23,41,0.45)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>— SUMMARY —</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>できた日数</span>
              <span style={{ fontSize: 16, color: hero.color, fontFamily: 'Cinzel, serif', fontWeight: 700 }}>{doneCount} / 7 日</span>
            </div>
            {topCategory && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>最後の修行</span>
                <span style={{ fontSize: 12, color: '#f1f5f9', fontFamily: 'Nunito, sans-serif', fontWeight: 700, maxWidth: 180, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topCategory}</span>
              </div>
            )}
            {nextStep && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Nunito, sans-serif', fontWeight: 700, flexShrink: 0 }}>明日の一手</span>
                <span style={{ fontSize: 12, color: '#f0c040', fontFamily: 'Nunito, sans-serif', fontWeight: 700, textAlign: 'right', lineHeight: 1.5 }}>{nextStep}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4: 次の修行へ */}
        <button onClick={handleRetry} style={{ width: '100%', padding: '15px', borderRadius: 12, border: '1px solid rgba(240,192,64,0.4)', background: 'rgba(240,192,64,0.1)', color: '#f0c040', fontFamily: 'Cinzel, serif', fontSize: 14, cursor: 'pointer', letterSpacing: '0.03em', fontWeight: 700 }}>
          {retryLabel}
        </button>
      </div>

      {/* 詳細を見るボタン */}
      <button
        onClick={() => setShowDetail(v => !v)}
        style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, cursor: 'pointer', fontWeight: 700, marginBottom: 12 }}
      >
        {showDetail ? '▲ 閉じる' : '▼ 詳細を見る'}
      </button>

      {/* 詳細エリア */}
      {showDetail && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>

          {/* 称号バッジ */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ display: 'inline-block', background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.35)', borderRadius: 100, padding: '8px 20px', fontFamily: 'Cinzel, serif', fontSize: 14, color: '#f0c040', animation: 'shimmer 2.5s ease-in-out infinite', letterSpacing: '0.05em' }}>
              {titleData.emoji} {titleData.title} — {streakWeeks}週達成
            </div>
          </div>

          {/* 修行ログ全文 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.05em' }}>修行ログ 📜</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = days.find(x => x.day_number === i + 1);
                const isDone = d?.status === 'done';
                const isNotDone = d?.status === 'not_done';
                return (
                  <div key={i} style={{ background: isDone ? 'rgba(240,192,64,0.06)' : isNotDone ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (isDone ? 'rgba(240,192,64,0.25)' : isNotDone ? 'rgba(248,113,113,0.2)' : '#2d3f5a'), borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: d ? 1 : 0.4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: isDone ? 'linear-gradient(135deg,#f0c040,#c49a20)' : '#0f1729', border: '1px solid ' + (isDone ? '#f0c040' : isNotDone ? '#f87171' : '#2d3f5a'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: 11, color: isDone ? '#0f1729' : '#94a3b8', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: d ? '#f1f5f9' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>
                      {d?.plan ?? '未記録'}
                    </div>
                    <span style={{ fontSize: 13, color: isDone ? '#f0c040' : '#f87171' }}>{isDone ? '✦' : isNotDone ? '✕' : '－'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 古代壁画ボタン */}
          <div style={{ marginBottom: 14 }}>
            <AncientWallButton challengeId={challengeId} />
          </div>

          {/* BuddyShare誘導 */}
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 20, padding: '22px 20px', textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#f1f5f9', marginBottom: 8, letterSpacing: '0.05em' }}>次のステージへ</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8, marginBottom: 16, fontWeight: 700 }}>本格的なBuddyShareで<br />仲間と長期的に走り続けよう。</div>
            <a href='https://myapp-hides-projects-19f80db4.vercel.app/' target='_blank' rel='noopener noreferrer' style={{ display: 'block', padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #f0c040, #c49a20)', color: '#0f1729', fontSize: 14, fontWeight: 800, textDecoration: 'none', fontFamily: 'Cinzel, serif', boxShadow: '0 4px 0 #8a6000', letterSpacing: '0.03em' }}>
              BuddyShareを試す →
            </a>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, fontWeight: 700 }}>パスワード: catcat</div>
          </div>
        </div>
      )}
    </div>
  );
}
