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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-8" style={{ background: '#f7f3ed' }}>
        <p style={{ color: '#6ba37a', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>
          5 minute start
        </p>
        <h1 style={{ color: '#2c2416', fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center', lineHeight: 1.7, fontFamily: 'Lora, serif' }}>
          手をつけてくれてありがとう。<br />
          <span style={{ color: '#7a7060', fontSize: '15px', fontWeight: 400, fontFamily: 'Nunito, sans-serif' }}>ごゆっくりどうぞ。</span>
        </h1>

        {/* タイマーリング */}
        <div className="relative flex items-center justify-center mb-8">
          <svg width="210" height="210" className="-rotate-90">
            <circle cx="105" cy="105" r={R} fill="none" stroke="#e0dbd0" strokeWidth="10" />
            <circle
              cx="105" cy="105" r={R}
              fill="none"
              stroke={running ? '#4a7c59' : '#6b9ab8'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s linear' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span style={{ color: '#2c2416', fontSize: '48px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {mm}:{ss}
            </span>
            <span style={{ color: '#7a7060', fontSize: '11px', marginTop: '4px', letterSpacing: '0.15em' }}>remaining</span>
          </div>
        </div>

        {/* おすすめ例 */}
        <div className="w-full max-w-xs mb-8">
          <p style={{ color: '#7a7060', fontSize: '11px', textAlign: 'center', marginBottom: '12px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>suggested</p>
          <div className="flex flex-col gap-3">
            {TIMER_EXAMPLES.map((ex) => {
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
                    border: `1.5px solid ${active ? '#4a7c59' : '#d4cabb'}`,
                    background: active ? 'rgba(74,124,89,0.08)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? '0 2px 12px rgba(74,124,89,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                    transform: active ? 'scale(1.01)' : 'scale(1)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{ex.icon}</span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'Nunito, sans-serif',
                      color: active ? '#2d5a3d' : '#2c2416',
                      flex: 1,
                    }}>{ex.text}</span>
                    {active && <span style={{ fontSize: '14px', color: '#4a7c59' }}>✓</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!running ? (
          <button
            onClick={startTimer}
            style={{ width: '100%', maxWidth: '320px', padding: '16px', borderRadius: '18px', border: 'none', background: '#4a7c59', color: '#ffffff', fontSize: '17px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(74,124,89,0.3)', fontFamily: 'Nunito, sans-serif' }}
          >
            スタート
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <p style={{ color: '#7a7060', fontSize: '14px' }}>ゆっくりどうぞ。ここにいます。</p>
            <button
              onClick={stopEarly}
              style={{ width: '100%', padding: '12px', borderRadius: '18px', border: '1px solid #d4cabb', background: '#ffffff', color: '#2c2416', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#f7f3ed' }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#4a7c59', borderTopColor: 'transparent' }} />
        <p style={{ color: '#7a7060', fontSize: '14px' }}>記録しています…</p>
      </div>
    );
  }

  // ── 完了画面 ──────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#f7f3ed' }}>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .fade-up { animation: fadeUp 0.5s ease both; }
        `}</style>

        {/* ヘッダー */}
        <div className="fade-up w-full max-w-xs mb-8 text-center" style={{ animationDelay: '0s' }}>
          <p style={{ color: '#6ba37a', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>day 1 complete</p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              borderRadius: '999px',
              background: 'rgba(74,124,89,0.08)',
              border: '1.5px solid #d4cabb',
              marginBottom: '20px',
            }}
          >
            <span style={{ color: '#4a7c59', fontSize: '14px', fontWeight: 600 }}>{savedNickname}</span>
            <span style={{ color: '#d4cabb', fontSize: '12px' }}>·</span>
            <span style={{ color: '#2d5a3d', fontSize: '14px', fontWeight: 600 }}>{savedActivity}</span>
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#2d5a3d',
              fontFamily: 'Lora, serif',
              marginBottom: '8px',
            }}
          >
            お疲れ様でした。
          </h1>
          <p style={{ color: '#7a7060', fontSize: '15px', fontWeight: 600 }}>1日目、ちゃんと残りましたよ。</p>
        </div>

        {/* ステータスカード */}
        <div className="fade-up w-full max-w-xs mb-8" style={{ animationDelay: '0.15s' }}>
          <div
            style={{
              borderRadius: '20px',
              border: '1px solid #d4cabb',
              background: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #e8e2d8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🔥</span>
                <span style={{ color: '#7a7060', fontSize: '15px' }}>連続記録</span>
              </div>
              <span style={{ color: '#2d5a3d', fontSize: '20px', fontWeight: 700 }}>1日</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #e8e2d8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>✨</span>
                <span style={{ color: '#7a7060', fontSize: '15px' }}>今日の達成者</span>
              </div>
              <span style={{ color: '#4a7c59', fontSize: '20px', fontWeight: 700 }}>
                {todayCount !== null ? `${todayCount}人` : '…'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🚀</span>
                <span style={{ color: '#7a7060', fontSize: '15px' }}>チャレンジ</span>
              </div>
              <span style={{ color: '#2c2416', fontSize: '15px', fontWeight: 600 }}>7日間スタート</span>
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
          style={{ width: '100%', maxWidth: '320px', padding: '16px', borderRadius: '18px', border: 'none', background: '#4a7c59', color: '#ffffff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(74,124,89,0.25)', fontFamily: 'Nunito, sans-serif' }}
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

  return (
    <div className="min-h-screen flex flex-col px-5 pt-12 pb-24" style={{ background: '#f7f3ed' }}>
      {/* ── 達成バナー ── */}
      <div className="mb-10">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 16px 16px',
            borderRadius: '24px',
            background: '#ffffff',
            border: '1.5px solid #d4cabb',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#6ba37a', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>
            Quest Complete
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#2d5a3d', fontFamily: 'Lora, serif', marginBottom: '8px', lineHeight: 1.3 }}>
            お疲れ様でした！
          </h1>
          <p style={{ color: '#7a7060', fontSize: '13px' }}>2問だけ答えて、チャレンジを始める</p>
        </div>
      </div>

      <section className="mb-9">
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a7c59', marginBottom: '10px', letterSpacing: '0.04em' }}>
          ニックネーム
          <span style={{ color: '#7a7060', fontSize: '12px', marginLeft: '8px', fontWeight: 400 }}>（空欄で自動生成）</span>
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={placeholderNick}
          maxLength={20}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1.5px solid #d4cabb',
            borderRadius: '14px',
            padding: '17px 20px',
            color: '#2c2416',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'Nunito, sans-serif',
          }}
        />
      </section>

      <section className="mb-9">
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a7c59', marginBottom: '12px', letterSpacing: '0.04em' }}>
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
                  border: active ? '1.5px solid #4a7c59' : '1.5px solid #d4cabb',
                  background: active ? 'rgba(74,124,89,0.10)' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 2px 10px rgba(74,124,89,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                  transform: active ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: '18px' }}>{opt.emoji}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: active ? '#2d5a3d' : '#7a7060', lineHeight: 1.2, textAlign: 'center' }}>
                  {opt.label}
                </span>
                {active && <span style={{ fontSize: '9px', color: '#4a7c59' }}>✓</span>}
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
              border: isOther ? '1.5px solid #6b9ab8' : '1.5px solid #d4cabb',
              background: isOther ? 'rgba(107,154,184,0.10)' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isOther ? '0 2px 10px rgba(107,154,184,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
              transform: isOther ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: '18px' }}>✏️</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: isOther ? '#2d5a3d' : '#7a7060' }}>その他</span>
            {isOther && <span style={{ fontSize: '9px', color: '#6b9ab8' }}>✓</span>}
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
              background: '#ffffff',
              border: '1.5px solid #6b9ab8',
              borderRadius: '14px',
              padding: '14px 18px',
              color: '#2c2416',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
        )}
      </section>

      <section className="mb-9">
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a7c59', marginBottom: '10px', letterSpacing: '0.04em' }}>
          明日は何を５分やる？
          <span style={{ color: '#7a7060', fontSize: '12px', marginLeft: '8px', fontWeight: 400 }}>（任意）</span>
        </label>
        <input
          type="text"
          value={tomorrow}
          onChange={(e) => setTomorrow(e.target.value)}
          placeholder="例：また読書を10ページ"
          maxLength={50}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1.5px solid #d4cabb',
            borderRadius: '14px',
            padding: '17px 20px',
            color: '#2c2416',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'Nunito, sans-serif',
          }}
        />
      </section>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(220,80,80,0.08)', border: '1px solid rgba(220,80,80,0.25)', marginBottom: '16px' }}>
          <p style={{ color: '#b94040', fontSize: '14px' }}>{error}</p>
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
          color: '#ffffff',
          border: 'none',
          cursor: canSave ? 'pointer' : 'not-allowed',
          background: canSave ? '#4a7c59' : '#b0bfb0',
          opacity: canSave ? 1 : 0.6,
          boxShadow: canSave ? '0 4px 16px rgba(74,124,89,0.25)' : 'none',
          transition: 'all 0.2s ease',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        記録して、チャレンジ開始 →
      </button>
    </div>
  );
}
