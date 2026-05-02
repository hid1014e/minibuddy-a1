'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import HatModal from '@/app/components/HatModal';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ACTIVITY_OPTIONS = [
  { emoji: '📚', label: '読書' },
  { emoji: '💪', label: '筋トレ' },
  { emoji: '💻', label: '作業' },
  { emoji: '✏️', label: '勉強' },
  { emoji: '🧹', label: '片付け' },
  { emoji: '🧘', label: 'ストレッチ' },
  { emoji: '🌿', label: '瞑想' },
];

const EXAMPLE_HINTS: Record<string, string> = {
  '読書': '本を2ページだけ読む',
  '筋トレ': 'スクワット10回だけ',
  '作業': 'メール1通だけ返す',
  '勉強': '問題を1問だけ解く',
  '片付け': '机の上を5分だけ片付ける',
  'ストレッチ': 'ストレッチ1種目だけ',
  '瞑想': '目を閉じて深呼吸3回だけ',
};

const TIMER_EXAMPLES = [
  { icon: '🗂', text: '机の上を5分だけ片付ける' },
  { icon: '🏋️', text: 'スクワット10回だけ' },
  { icon: '📖', text: '本を2ページだけ読む' },
  { icon: '📧', text: 'メール1通だけ返す' },
  { icon: '🧘', text: 'ストレッチ1種目だけ' },
];

const ADJECTIVES = ['静かな', '小さな', '勇敢な', '光る', '眠れる', '謎の'];
const NOUNS = ['魔法使い', '探求者', '冒険者', '守り手', '旅人', '賢者'];
function generateNickname() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a}${n}`;
}

type Phase = 'timer' | 'form' | 'done' | 'saving';
const TOTAL_SEC = 5 * 60;

const CARD_GRADIENTS = [
  'linear-gradient(135deg, rgba(240,192,64,0.18), rgba(240,192,64,0.06))',
  'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(109,40,217,0.06))',
  'linear-gradient(135deg, rgba(240,192,64,0.14), rgba(139,92,246,0.10))',
  'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(240,192,64,0.08))',
  'linear-gradient(135deg, rgba(196,168,240,0.14), rgba(139,92,246,0.06))',
];
const CARD_BORDERS_ACTIVE = [
  'rgba(240,192,64,0.7)',
  'rgba(139,92,246,0.8)',
  'rgba(240,192,64,0.65)',
  'rgba(139,92,246,0.75)',
  'rgba(196,168,240,0.7)',
];
const CARD_BORDERS_IDLE = [
  'rgba(240,192,64,0.2)',
  'rgba(139,92,246,0.25)',
  'rgba(240,192,64,0.18)',
  'rgba(139,92,246,0.2)',
  'rgba(196,168,240,0.18)',
];
const CARD_TEXT_ACTIVE = ['#f0c040', '#c4a8f0', '#f0c040', '#c4a8f0', '#c4a8f0'];
const CARD_TEXT_IDLE = ['#c9a84c', '#9b7fd4', '#c9a84c', '#9b7fd4', '#9b7fd4'];
const CARD_GLOWS = [
  '0 0 20px rgba(240,192,64,0.35)',
  '0 0 20px rgba(139,92,246,0.4)',
  '0 0 20px rgba(240,192,64,0.3)',
  '0 0 20px rgba(139,92,246,0.35)',
  '0 0 20px rgba(196,168,240,0.3)',
];

export default function QuickStartPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('timer');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [nickname, setNickname] = useState('');
  const [placeholderNick] = useState(generateNickname);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [customActivity, setCustomActivity] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [error, setError] = useState('');
  const [savedChallengeId, setSavedChallengeId] = useState<string | null>(null);
  const [savedNickname, setSavedNickname] = useState('');
  const [savedActivity, setSavedActivity] = useState('');
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [tappedExample, setTappedExample] = useState<string | null>(null);
  const [showHatModal, setShowHatModal] = useState(false);

  const startTimer = useCallback(() => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= TOTAL_SEC) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setPhase('form');
          return TOTAL_SEC;
        }
        return e + 1;
      });
    }, 1000);
  }, []);

  const stopEarly = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase('form');
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current!); };
  }, []);

  function handleTapExample(text: string) {
    setTappedExample(text);
    const matched = ACTIVITY_OPTIONS.find(o => text.includes(o.label));
    if (matched) {
      setSelectedActivity(matched.label);
    } else {
      setSelectedActivity('other');
      setCustomActivity(text);
    }
  }

  const remaining = TOTAL_SEC - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const progress = elapsed / TOTAL_SEC;
  const R = 88;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - progress);

  async function handleSave() {
    setError('');
    const activityLabel =
      selectedActivity === 'other'
        ? customActivity.trim()
        : selectedActivity ?? customActivity.trim();
    if (!activityLabel) {
      setError('何をしたか教えてください');
      return;
    }
    setPhase('saving');
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw authErr ?? new Error('no user');
      const finalNick = nickname.trim() || placeholderNick;
      await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, nickname: finalNick }, { onConflict: 'user_id' });
      const { data: challenge, error: cErr } = await supabase
        .from('mini_challenges')
        .insert({
          owner_user_id: user.id,
          theme: activityLabel,
          goal: activityLabel,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (cErr || !challenge) throw cErr ?? new Error('challenge insert failed');
      await supabase.from('mini_challenge_days').insert({
        mini_challenge_id: challenge.id,
        day_number: 1,
        plan: activityLabel,
        status: 'done',
        next_step: tomorrow.trim() || null,
        updated_at: new Date().toISOString(),
      });
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from('mini_challenge_days')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .gte('updated_at', today + 'T00:00:00');
      setTodayCount(count ?? 1);
      setSavedChallengeId(challenge.id);
      setSavedNickname(finalNick);
      setSavedActivity(activityLabel);
      setPhase('done');
    } catch (e) {
      console.error(e);
      setError('保存に失敗しました。もう一度お試しください。');
      setPhase('form');
    }
  }

  // ── タイマー画面 ──────────────────────────────────────────
  if (phase === 'timer') {
    return (
      <div className="min-h-screen bg-[#0e0b1a] flex flex-col items-center justify-center px-4 pb-8">
        <p className="text-amber-300/60 text-xs tracking-widest uppercase mb-3 font-light">
          5 minute quest
        </p>
        <h1 className="text-white text-xl font-semibold mb-6 tracking-wide text-center leading-relaxed">
          5分だけ。<br />
          <span className="text-white/40 text-base font-normal">人は大体5分なら騙せます</span>
        </h1>

        {/* タイマーリング */}
        <div className="relative flex items-center justify-center mb-8">
          <svg width="210" height="210" className="-rotate-90">
            <circle cx="105" cy="105" r={R} fill="none" stroke="#1e1730" strokeWidth="10" />
            <circle
              cx="105" cy="105" r={R}
              fill="none"
              stroke={running ? '#f59e0b' : '#6b5aff'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s linear' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-white text-5xl font-mono font-bold tracking-tight">
              {mm}:{ss}
            </span>
            <span className="text-white/30 text-xs mt-1 tracking-widest">remaining</span>
          </div>
        </div>

        {/* おすすめ例 */}
        <div className="w-full max-w-xs mb-8">
          <p className="text-white/30 text-xs text-center mb-3 tracking-widest uppercase">
            suggested quests
          </p>
          <div className="flex flex-col gap-3">
            {TIMER_EXAMPLES.map((ex, i) => {
              const active = tappedExample === ex.text;
              return (
                <button
                  key={ex.text}
                  onClick={() => handleTapExample(ex.text)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: `1.5px solid ${active ? CARD_BORDERS_ACTIVE[i % CARD_BORDERS_ACTIVE.length] : CARD_BORDERS_IDLE[i % CARD_BORDERS_IDLE.length]}`,
                    background: active ? CARD_GRADIENTS[i % CARD_GRADIENTS.length].replace('0.18', '0.28').replace('0.14', '0.22') : CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? CARD_GLOWS[i % CARD_GLOWS.length] : 'none',
                    transform: active ? 'scale(1.01)' : 'scale(1)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px', filter: active ? 'drop-shadow(0 0 6px rgba(240,192,64,0.6))' : 'none' }}>{ex.icon}</span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: 'Nunito, sans-serif',
                      color: active ? CARD_TEXT_ACTIVE[i % CARD_TEXT_ACTIVE.length] : CARD_TEXT_IDLE[i % CARD_TEXT_IDLE.length],
                      flex: 1,
                    }}>{ex.text}</span>
                    {active && (
                      <span style={{
                        fontSize: '12px',
                        color: i % 2 === 0 ? '#f0c040' : '#c4a8f0',
                        textShadow: i % 2 === 0 ? '0 0 8px rgba(240,192,64,0.8)' : '0 0 8px rgba(196,168,240,0.8)',
                      }}>✦</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!running ? (
          <button
            onClick={startTimer}
            className="w-full max-w-xs py-4 rounded-2xl text-white text-lg font-semibold tracking-wide bg-gradient-to-r from-violet-600 to-amber-500 shadow-[0_4px_24px_rgba(109,40,217,0.5)] hover:opacity-90 active:scale-95 transition-all duration-150"
          >
            ✨ スタート
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <p className="text-white/40 text-sm tracking-wide">集中して！ずっとここにいるよ 🕯️</p>
            <button
              onClick={stopEarly}
              className="w-full py-3 rounded-2xl text-white/60 text-base font-medium border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:text-white/80 active:scale-95 transition-all duration-150"
            >
              終わった！記録する →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── 保存中 ──────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <div className="min-h-screen bg-[#0e0b1a] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <p className="text-white/50 text-sm tracking-wide">記録しています…</p>
      </div>
    );
  }

  // ── 完了画面 ──────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-[#0e0b1a] flex flex-col items-center justify-center px-6">
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .fade-up { animation: fadeUp 0.5s ease both; }
        `}</style>

        {/* ヘッダー */}
        <div className="fade-up w-full max-w-xs mb-8 text-center" style={{ animationDelay: '0s' }}>
          <p className="text-amber-300/60 text-xs tracking-widest uppercase mb-4">day 1 complete</p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(109,40,217,0.10))',
              border: '1.5px solid rgba(139,92,246,0.35)',
              boxShadow: '0 0 18px rgba(139,92,246,0.2)',
              marginBottom: '20px',
            }}
          >
            <span style={{ color: '#c4a8f0', fontSize: '12px' }}>✦</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600 }}>{savedNickname}</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>·</span>
            <span style={{ color: '#f0c040', fontSize: '14px', fontWeight: 600 }}>{savedActivity}</span>
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              background: 'linear-gradient(135deg, #f0c040 0%, #c4a8f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}
          >
            お疲れ様でした☕️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>1日目を刻んだ</p>
        </div>

        {/* ステータスカード */}
        <div className="fade-up w-full max-w-xs mb-8" style={{ animationDelay: '0.15s' }}>
          <div
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'linear-gradient(160deg, rgba(139,92,246,0.08) 0%, rgba(14,11,26,0.6) 100%)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }}>🔥</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px' }}>連続記録</span>
              </div>
              <span style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 700, textShadow: '0 0 12px rgba(251,191,36,0.5)' }}>1日</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.6))' }}>✨</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px' }}>今日の達成者</span>
              </div>
              <span style={{ color: '#c4a8f0', fontSize: '20px', fontWeight: 700, textShadow: '0 0 12px rgba(196,168,240,0.5)' }}>
                {todayCount !== null ? `${todayCount}人` : '…'}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' }}>🚀</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px' }}>チャレンジ</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', fontWeight: 600 }}>7日間スタート</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const hatShown = localStorage.getItem('hat_shown');
            if (!hatShown) {
              localStorage.setItem('show_hat_modal', '1');
            }
            localStorage.setItem('onboarding_done', '1');
            localStorage.removeItem('qs_in_progress');
            router.push('/');
          }}
          className="fade-up w-full max-w-xs py-4 rounded-2xl text-white text-lg font-semibold tracking-wide bg-gradient-to-r from-violet-600 to-amber-500 shadow-[0_4px_24px_rgba(109,40,217,0.5)] hover:opacity-90 active:scale-95 transition-all duration-150"
          style={{ animationDelay: '0.3s' }}
        >
          ホームへ →
        </button>
        {showHatModal && (
          <HatModal
            onDismiss={() => {
              localStorage.setItem('hat_shown', '1');
              localStorage.setItem('onboarding_done', '1');
              localStorage.removeItem('qs_in_progress');
              setShowHatModal(false);
              router.push('/');
            }}
          />
        )}
      </div>
    );
  }

  // ── フォーム画面 ──────────────────────────────────────────
  const isOther = selectedActivity === 'other';
  const canSave = selectedActivity !== null && (selectedActivity !== 'other' || customActivity.trim().length > 0);
  const hintText = selectedActivity && selectedActivity !== 'other' ? EXAMPLE_HINTS[selectedActivity] : null;

  return (
    <div className="min-h-screen bg-[#0e0b1a] flex flex-col px-5 pt-12 pb-24">
      {/* ── 達成バナー ── */}
      <div className="mb-10">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '14px 16px 12px',
            borderRadius: '24px',
            background: 'linear-gradient(160deg, rgba(139,92,246,0.22) 0%, rgba(240,192,64,0.12) 100%)',
            border: '1.5px solid rgba(240,192,64,0.35)',
            boxShadow: '0 0 40px rgba(139,92,246,0.2), 0 0 20px rgba(240,192,64,0.1)',
            marginBottom: '0px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#f0c040',
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              textShadow: '0 0 10px rgba(240,192,64,0.6)',
            }}
          >
            ✦ Quest Complete ✦
          </p>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f0c040 0%, #ffffff 50%, #c4a8f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              lineHeight: 1.2,
              textShadow: 'none',
            }}
          >
            お疲れ様でした！
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>2問だけ答えて、チャレンジを始める</p>
        </div>
      </div>

      <section className="mb-9">
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(196,168,240,0.8)',
            marginBottom: '10px',
            letterSpacing: '0.04em',
          }}
        >
          ニックネーム
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginLeft: '8px', fontWeight: 400 }}>
            （空欄で自動生成）
          </span>
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={placeholderNick}
          maxLength={20}
          style={{
            width: '100%',
            background: 'rgba(139,92,246,0.13)',
            border: '1.5px solid rgba(139,92,246,0.5)',
            borderRadius: '14px',
            padding: '17px 20px',
            color: 'white',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          className="focus:border-violet-400/80 focus:bg-violet-900/25 transition-all duration-150 placeholder-white/35"
        />
      </section>

      <section className="mb-9">
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(240,192,64,0.8)',
            marginBottom: '12px',
            letterSpacing: '0.04em',
          }}
        >
          今日やったこと
        </label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {ACTIVITY_OPTIONS.map((opt) => {
            const active = selectedActivity === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => setSelectedActivity(opt.label)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 4px',
                  borderRadius: '14px',
                  border: active ? '1.5px solid rgba(139,92,246,0.8)' : '1.5px solid rgba(255,255,255,0.18)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(109,40,217,0.12))'
                    : 'rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 0 18px rgba(139,92,246,0.4)' : 'none',
                  transform: active ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: '18px', filter: active ? 'drop-shadow(0 0 6px rgba(167,139,250,0.7))' : 'none' }}>
                  {opt.emoji}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: active ? 'white' : 'rgba(255,255,255,0.65)',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  {opt.label}
                </span>
                {active && <span style={{ fontSize: '9px', color: '#c4a8f0' }}>✦</span>}
              </button>
            );
          })}
          <button
            onClick={() => setSelectedActivity('other')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 4px',
              borderRadius: '14px',
              border: isOther ? '1.5px solid rgba(240,192,64,0.7)' : '1.5px solid rgba(255,255,255,0.18)',
              background: isOther
                ? 'linear-gradient(135deg, rgba(240,192,64,0.2), rgba(245,158,11,0.08))'
                : 'rgba(255,255,255,0.07)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isOther ? '0 0 18px rgba(240,192,64,0.35)' : 'none',
              transform: isOther ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: '18px' }}>✏️</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: isOther ? 'white' : 'rgba(255,255,255,0.65)' }}>その他</span>
            {isOther && <span style={{ fontSize: '9px', color: '#f0c040' }}>✦</span>}
          </button>
        </div>

        {isOther && (
          <input
            type="text"
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            placeholder="例：ギター、散歩、日記…"
            maxLength={30}
            autoFocus
            style={{
              width: '100%',
              background: 'rgba(240,192,64,0.06)',
              border: '1.5px solid rgba(240,192,64,0.3)',
              borderRadius: '14px',
              padding: '14px 18px',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        )}
      </section>

      <section className="mb-9">
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(196,168,240,0.7)',
            marginBottom: '10px',
            letterSpacing: '0.04em',
          }}
        >
          明日は何を５分やる？
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginLeft: '8px', fontWeight: 400 }}>
            （任意）
          </span>
        </label>
        <input
          type="text"
          value={tomorrow}
          onChange={(e) => setTomorrow(e.target.value)}
          placeholder="例：また読書を10ページ"
          maxLength={50}
          style={{
            width: '100%',
            background: 'rgba(139,92,246,0.13)',
            border: '1.5px solid rgba(139,92,246,0.45)',
            borderRadius: '14px',
            padding: '17px 20px',
            color: 'white',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          className="focus:border-violet-400/80 transition-all duration-150 placeholder-white/35"
        />
      </section>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            marginBottom: '16px',
          }}
        >
          <p style={{ color: '#f87171', fontSize: '14px' }}>{error}</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          fontSize: '17px',
          fontWeight: 700,
          letterSpacing: '0.03em',
          color: 'white',
          border: 'none',
          cursor: canSave ? 'pointer' : 'not-allowed',
          background: canSave
            ? 'linear-gradient(135deg, #7c3aed 0%, #f59e0b 100%)'
            : 'rgba(255,255,255,0.08)',
          opacity: canSave ? 1 : 0.4,
          boxShadow: canSave ? '0 4px 24px rgba(109,40,217,0.5)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        記録して、チャレンジ開始 →
      </button>
    </div>
  )
}
