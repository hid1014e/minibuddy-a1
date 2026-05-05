'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getDays, saveDay, completeChallenge,
  getTodayDoneCount, getTodayClapCount, sendClap, hasClappedToday,
  ensureAuth, checkPost, getMyCheerCount,
  getStreakWeeks, getTitle, getProfile, uploadDayImage,
} from '@/lib/api';
import { MiniChallengeDay } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import ResultDetailModal, { type ChallengeResult } from '@/app/components/ResultDetailModal';
import HatModal from '@/app/components/HatModal';
import { calcTodayDayNumber as calcTodayDay } from '@/lib/api';

const THEMES: Record<string, { icon: string; color: string }> = {
  '健康': { icon: '💊', color: '#34d399' },
  'お金': { icon: '🪙', color: '#4a7c59' },
  '夢': { icon: '🔮', color: '#a78bfa' },
  'キャリア': { icon: '📜', color: '#7dd3fc' },
  '人間関係': { icon: '🫂', color: '#fda4af' },
  'その他': { icon: '🧪', color: '#8a8070' },
};

type Post = {
  id: string;
  owner_user_id: string;
  plan: string;
  status: string;
  day_number: number;
  image_url: string | null;
  nickname: string;
  theme: string | null;
  check_count: number;
  already_checked: boolean;
  goal: string | null;
  streak_weeks: number;
  has_new_comment: boolean;
  mini_titles: string[];
};

type Comment = {
  id: string;
  user_id: string;
  nickname: string;
  body: string;
  reply_to: string | null;
  created_at: string;
};

function CommentSection({ postId, myUserId }: { postId: string; myUserId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 3;

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('post_comments')
      .select('id, user_id, nickname, body, reply_to, created_at')
      .eq('day_id', postId)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as Comment[]);
  }, [postId]);

  useEffect(() => { refresh(); }, [refresh]);

  const visible = showAll ? comments : comments.slice(0, PREVIEW);
  const hidden = comments.length - PREVIEW;

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    const { data: prof } = await supabase.from('user_profiles').select('nickname').eq('user_id', myUserId).maybeSingle();
    await supabase.from('post_comments').insert({
      day_id: postId,
      user_id: myUserId,
      nickname: prof?.nickname ?? '匿名',
      body,
      reply_to: replyTo?.id ?? null,
    });
    setInput('');
    setReplyTo(null);
    setSending(false);
    await refresh();
    setShowAll(true);
  }

  const nicknameOf = (id: string) => comments.find(c => c.id === id)?.nickname ?? '';

  return (
    <div style={{ marginTop: 10, borderTop: '1px solid #2d3f5a', paddingTop: 10 }}>
      {comments.length === 0 && (
        <p style={{ fontSize: 12, color: '#8a8070', fontFamily: 'Nunito, sans-serif', margin: '0 0 8px' }}>
          まだコメントはありません
        </p>
      )}
      {visible.map(c => (
        <div key={c.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', fontFamily: 'Nunito, sans-serif' }}>{c.nickname}</span>
            {c.reply_to && (
              <span style={{ fontSize: 11, color: '#7dd3fc', fontFamily: 'Nunito, sans-serif', marginLeft: 6 }}>
                @{nicknameOf(c.reply_to)}
              </span>
            )}
            <span style={{ fontSize: 13, color: '#2c2416', fontFamily: 'Nunito, sans-serif', marginLeft: 6 }}>{c.body}</span>
          </div>
          <button
            onClick={() => setReplyTo(replyTo?.id === c.id ? null : { id: c.id, nickname: c.nickname })}
            style={{ fontSize: 11, color: replyTo?.id === c.id ? '#7dd3fc' : '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, flexShrink: 0 }}
          >
            {replyTo?.id === c.id ? '✕' : '返信'}
          </button>
        </div>
      ))}
      {!showAll && hidden > 0 && (
        <button onClick={() => setShowAll(true)} style={{ fontSize: 12, color: '#7dd3fc', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginBottom: 8, display: 'block' }}>
          ▼ 他{hidden}件を見る
        </button>
      )}
      {showAll && comments.length > PREVIEW && (
        <button onClick={() => setShowAll(false)} style={{ fontSize: 12, color: '#8a8070', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginBottom: 8, display: 'block' }}>
          ▲ 折りたたむ
        </button>
      )}
      {replyTo && (
        <div style={{ fontSize: 11, color: '#7dd3fc', fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          ↩ {replyTo.nickname} に返信中
          <button onClick={() => setReplyTo(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a8070', fontSize: 12 }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={replyTo ? `${replyTo.nickname}へ返信...` : 'コメント（50文字以内）'}
          maxLength={50}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #d4cabb', background: '#fafaf8', color: '#2c2416', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none' }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: input.trim() ? 'linear-gradient(135deg,#4a7c59,#2d5a3d)' : '#2d3f5a', color: input.trim() ? '#fafaf8' : '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: input.trim() ? 'pointer' : 'not-allowed' }}
        >
          {sending ? '...' : '送信'}
        </button>
      </div>
    </div>
  );
}


export default function ChallengePage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [days, setDays] = useState<MiniChallengeDay[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [clapCount, setClapCount] = useState(0);
  const [clapped, setClapped] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLimit, setPostsLimit] = useState(5);
  const [commentedUsersCount, setCommentedUsersCount] = useState(0);
  const [cheerCount, setCheerCount] = useState(0);
  const [goal, setGoal] = useState<string | null>(null);
  const [theme, setChallengeTheme] = useState<string | null>(null);
  const [streakWeeks, setStreakWeeks] = useState(0);
  const [todayDayNum, setTodayDayNum] = useState(1);
  const [myNickname, setMyNickname] = useState('');
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState<'done' | 'not_done' | null>(null);
  const [nextStep, setNextStep] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);
  const [showCrystalOverlay, setShowCrystalOverlay] = useState(false);
  const [showHatModal, setShowHatModal] = useState(false);
  const [resultChallenge, setResultChallenge] = useState<ChallengeResult | null>(null);
  const [challengeStartedAt, setChallengeStartedAt] = useState<string | null>(null);

  const todayFilled = days.some(d => d.day_number === todayDayNum);
  const canAddToday = todayDayNum <= 7 && !todayFilled && !showForm;

  const loadPosts = useCallback(async (dayNum: number, uid: string) => {
    const { data: allDays } = await supabase
      .from('mini_challenge_days')
      .select('id, plan, status, day_number, image_url, updated_at, mini_challenge_id, mini_challenges!inner(id, owner_user_id, theme, status)')
      .eq('mini_challenges.status', 'active')
      .order('updated_at', { ascending: false });

    if (!allDays || allDays.length === 0) { setPosts([]); return; }

    // !inner結合のフィルターが効かないケースに備え、フロントでも絞り込む
    const activeDays = (allDays as any[]).filter((d: any) => d.mini_challenges?.status === 'active');
    if (activeDays.length === 0) { setPosts([]); return; }

    const { data: blocks } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', uid);
    const blockedIds = new Set((blocks ?? []).map((b: any) => b.blocked_id));

    const others = activeDays.filter((d: any) =>
      !blockedIds.has(d.mini_challenges.owner_user_id)
    );
    if (others.length === 0) { setPosts([]); return; }

    const seenUsers = new Set<string>();
    const deduplicated = others.filter((d: any) => {
      const ownerId = d.mini_challenges.owner_user_id;
      if (seenUsers.has(ownerId)) return false;
      seenUsers.add(ownerId);
      return true;
    });

    // 直近7日以内にコメントしたことがある相手のuser_idを取得
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: myComments } = await supabase
      .from('post_comments')
      .select('day_id')
      .eq('user_id', uid)
      .gte('created_at', sevenDaysAgo);
    const commentedDayIds = new Set((myComments ?? []).map((c: any) => c.day_id));

    // コメントした投稿のowner_user_idを特定
    const commentedUserIds = new Set<string>();
    deduplicated.forEach((d: any) => {
      if (commentedDayIds.has(d.id)) commentedUserIds.add(d.mini_challenges.owner_user_id);
    });

    const myPost = deduplicated.filter((d: any) => d.mini_challenges.owner_user_id === uid);
    const commentedPosts = deduplicated.filter((d: any) =>
      d.mini_challenges.owner_user_id !== uid && commentedUserIds.has(d.mini_challenges.owner_user_id)
    );
    const otherPosts = deduplicated.filter((d: any) =>
      d.mini_challenges.owner_user_id !== uid && !commentedUserIds.has(d.mini_challenges.owner_user_id)
    );

    // コメントやり取りしたユーザー数を保存（もっと見る表示判定用）
    setCommentedUsersCount(commentedUserIds.size);

    // 優先4件 + 5枠目ランダム差し込み
    const priorityAll = [...myPost, ...commentedPosts, ...otherPosts];
    const priority4 = priorityAll.slice(0, 4);
    const priority4Ids = new Set(priority4.map((d: any) => d.id));
    const remaining = priorityAll.filter((d: any) => !priority4Ids.has(d.id));

    const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeRemaining = remaining.filter((d: any) => (d.updated_at ?? '') >= sevenDaysAgoStr);
    const zombieRemaining = remaining.filter((d: any) => (d.updated_at ?? '') < sevenDaysAgoStr);

    let slot5: any | null = null;
    if (remaining.length > 0) {
      const useZombie = Math.random() < 0.3 && zombieRemaining.length > 0;
      const pool = useZombie ? zombieRemaining : activeRemaining.length > 0 ? activeRemaining : zombieRemaining;
      slot5 = pool[Math.floor(Math.random() * pool.length)];
    }

    const sorted = slot5 ? [...priority4, slot5] : priority4;
    const ownerIds = sorted.map((d: any) => d.mini_challenges.owner_user_id);
    const dayIds = sorted.map((d: any) => d.id);

    // 自分のdayへの未読コメント取得（自分以外が書いたもの）
    const { data: myDays } = await supabase
      .from('mini_challenge_days')
      .select('id')
      .eq('mini_challenge_id', challengeId);
    const myDayIds = (myDays ?? []).map((d: any) => d.id);
    const { data: incomingComments } = myDayIds.length > 0
      ? await supabase.from('post_comments').select('day_id').in('day_id', myDayIds).neq('user_id', uid)
      : { data: [] };
    const dayIdsWithNewComment = new Set((incomingComments ?? []).map((c: any) => c.day_id));

    const [{ data: profiles }, { data: checks }, { data: allChallenges }] = await Promise.all([
      supabase.from('user_profiles').select('user_id, nickname, mini_titles').in('user_id', ownerIds),
      supabase.from('day_checks').select('target_day_id, checker_id').in('target_day_id', dayIds),
      supabase.from('mini_challenges').select('id, owner_user_id, started_at, goal').in('owner_user_id', ownerIds).order('started_at', { ascending: true }),
    ]);

    const challengeWeekMap: Record<string, number> = {};
    const userChallengeCount: Record<string, number> = {};
    const userGoalMap: Record<string, string | null> = {};
    const userStreakMap: Record<string, number> = {};
    (allChallenges ?? []).forEach((c: any) => {
      userChallengeCount[c.owner_user_id] = (userChallengeCount[c.owner_user_id] ?? 0) + 1;
      challengeWeekMap[c.id] = userChallengeCount[c.owner_user_id];
      userGoalMap[c.owner_user_id] = c.goal ?? null;
      userStreakMap[c.owner_user_id] = userChallengeCount[c.owner_user_id] - 1;
    });

    setPosts(sorted.map((d: any) => {
      const profile = (profiles ?? []).find((p: any) => p.user_id === d.mini_challenges.owner_user_id);
      const dayChecks = (checks ?? []).filter((c: any) => c.target_day_id === d.id);
      const baseNickname = profile?.nickname ?? '匿名';
      const weekNum = challengeWeekMap[d.mini_challenges.id] ?? 1;
      const nickname = weekNum >= 2 ? `${baseNickname}（${weekNum}周目）` : baseNickname;
      return {
        id: d.id,
        owner_user_id: d.mini_challenges.owner_user_id,
        plan: d.plan ?? '',
        status: d.status,
        day_number: d.day_number,
        image_url: d.image_url ?? null,
        nickname,
        theme: d.mini_challenges.theme ?? null,
        check_count: dayChecks.length,
        already_checked: dayChecks.some((c: any) => c.checker_id === uid),
        goal: userGoalMap[d.mini_challenges.owner_user_id] ?? null,
        streak_weeks: userStreakMap[d.mini_challenges.owner_user_id] ?? 0,
        mini_titles: (profiles ?? []).find((p: any) => p.user_id === d.mini_challenges.owner_user_id)?.mini_titles ?? [],
        has_new_comment: (() => {
          if (d.mini_challenges.owner_user_id !== uid) return false;
          if (!dayIdsWithNewComment.has(d.id)) return false;
          const readCounts: Record<string, number> = JSON.parse(localStorage.getItem('read_comment_counts') || '{}');
          const lastReadCount = readCounts[d.id] ?? 0;
          const currentCount = (incomingComments ?? []).filter((c: any) => c.day_id === d.id).length;
          return currentCount > lastReadCount;
        })(),
      };
    }));
  }, []);

  const load = useCallback(async () => {
    const user = await ensureAuth();
    setUserId(user?.id ?? null);
    const d = await getDays(challengeId);
    setDays(d);
    setDoneCount(await getTodayDoneCount());
    setClapCount(await getTodayClapCount());

    const { data: challenge } = await supabase.from('mini_challenges').select().eq('id', challengeId).maybeSingle();
    if (challenge?.status === 'done') { router.replace(`/challenge/${challengeId}/complete`); return; }
    if (challenge?.goal) setGoal(challenge.goal);
    if (challenge?.theme) setChallengeTheme(challenge.theme);
    if (challenge?.started_at) setChallengeStartedAt(challenge.started_at);
    const dayNum = challenge ? calcTodayDay(challenge.started_at) : 1;
    setTodayDayNum(dayNum);

    if (user) {
      const [cheers, alreadyClapped, weeks, profile] = await Promise.all([
        getMyCheerCount(challengeId, dayNum),
        hasClappedToday(user.id),
        getStreakWeeks(),
        getProfile(user.id),
      ]);
      setCheerCount(cheers);
      setClapped(alreadyClapped);
      setStreakWeeks(weeks);
      setMyNickname(profile?.nickname ?? '');
      await loadPosts(dayNum, user.id);
    }

  }, [challengeId, router, loadPosts]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset_hat') === '1') {
      localStorage.removeItem('hat_shown');
    }
  }, []);

  function openNewForm() { setEditingDay(null); setPlan(''); setStatus(null); setNextStep(''); setImageFile(null); setImagePreview(null); setShowForm(true); }
  function openEditForm(day: MiniChallengeDay) { setEditingDay(day.day_number); setPlan(day.plan); setStatus(day.status); setNextStep(day.next_step ?? ''); setImageFile(null); setImagePreview(day.image_url ?? null); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditingDay(null); setPlan(''); setStatus(null); setNextStep(''); setImageFile(null); setImagePreview(null); }

  async function handleSave() {
    if (!plan.trim() || !status) return;
    setSaving(true);
    const targetDay = editingDay ?? todayDayNum;
    let imageUrl: string | undefined;
    if (imageFile) imageUrl = await uploadDayImage(imageFile, challengeId, targetDay);
    else if (imagePreview?.startsWith('http')) imageUrl = imagePreview;
    await saveDay(challengeId, targetDay, plan.trim(), status, nextStep.trim() || undefined, imageUrl);
    if (targetDay === 7) { await completeChallenge(challengeId); router.replace(`/challenge/${challengeId}/complete`); return; }
    if (status === 'done') {
      const hatShown = localStorage.getItem('hat_shown');
      if (!hatShown) {
        await load(); closeForm(); setSaving(false);
        setShowHatModal(true);
        return;
      }
    }
    await load(); closeForm(); setSaving(false);
  }

  async function handleGoalSave() {
    const trimmed = goalInput.trim();
    if (!trimmed) return;
    setGoalSaving(true);
    await supabase.from('mini_challenges').update({ goal: trimmed }).eq('id', challengeId);
    setGoal(trimmed);
    setGoalEditing(false);
    setGoalSaving(false);
  }

  async function handleClap() {
    if (clapped || !userId) return;
    setClapped(true); setClapCount(c => c + 1);
    await sendClap(userId);
  }

  async function handleCheck(postId: string, idx: number) {
    if (!userId) return;
    const updated = [...posts];
    updated[idx] = { ...updated[idx], already_checked: true, check_count: updated[idx].check_count + 1 };
    setPosts(updated);
    await checkPost(userId, postId);
  }

  const titleData = getTitle(streakWeeks);
  const themeData = theme ? THEMES[theme] : null;
  const daysProgress = days.filter(d => d.status === 'done').length;

  return (
    <div style={{ paddingTop: 24 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes shimmer { 0%,100% { box-shadow:0 0 8px rgba(74,124,89,0.2); } 50% { box-shadow:0 0 20px rgba(74,124,89,0.5); } }
        @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes floatUp { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes sparkle { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.3); } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: '#2d5a3d' }}>やわらかの旅</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {myNickname && (
            <button onClick={() => router.push('/settings')} style={{ background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.25)', borderRadius: 100, padding: '5px 12px', fontSize: 12, color: '#4a7c59', fontWeight: 800, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }}>
              <img src="https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/sun.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain', verticalAlign: 'middle' }} /> {myNickname}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'inline-block', background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.3)', borderRadius: 100, padding: '5px 14px', fontSize: 11, color: '#4a7c59', fontWeight: 700, animation: 'shimmer 3s ease-in-out infinite' }}>
          {titleData.emoji} {titleData.title}
        </div>
      </div>

      {goal !== null && (
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '14px 16px', marginBottom: 14, border: '1px solid #d4cabb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {themeData && <span style={{ color: themeData.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, border: `1px solid ${themeData.color}`, background: `${themeData.color}18` }}>{themeData.icon} {theme}</span>}
            <span style={{ fontSize: 11, color: '#8a8070', fontWeight: 700 }}>7日間の目標</span>
            {!goalEditing && (
              <button
                onClick={() => { setGoalEditing(true); setGoalInput(goal ?? ''); }}
                style={{ marginLeft: 'auto', fontSize: 11, color: '#8a8070', background: 'transparent', border: '1px solid #d4cabb', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
              >編集</button>
            )}
          </div>
          {goalEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(74,124,89,0.4)', background: '#fafaf8', color: '#2c2416', fontSize: 14, fontFamily: 'Nunito, sans-serif', resize: 'none', boxSizing: 'border-box' as const, outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setGoalEditing(false)}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid #d4cabb', background: 'transparent', color: '#8a8070', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >キャンセル</button>
                <button
                  onClick={handleGoalSave}
                  disabled={!goalInput.trim() || goalSaving}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: (!goalInput.trim() || goalSaving) ? '#2d3f5a' : 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: (!goalInput.trim() || goalSaving) ? '#94a3b8' : '#fafaf8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: (!goalInput.trim() || goalSaving) ? 'not-allowed' : 'pointer' }}
                >{goalSaving ? '保存中...' : '保存'}</button>
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#2c2416', lineHeight: 1.5 }}>{goal}</div>
          )}
        </div>
      )}

      {cheerCount > 0 && (
        <div style={{ background: 'rgba(74,124,89,0.07)', border: '1px solid rgba(74,124,89,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#4a7c59', fontWeight: 800 }}>✦ 今日{cheerCount}人に応援されました！</span>
        </div>
      )}

      <div style={{ background: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 14, border: '1px solid #d4cabb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#8a8070' }}>修行の記録</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#2c2416' }}>{daysProgress}<span style={{ fontSize: 13, color: '#8a8070' }}>/7</span></div>
        </div>
        <div style={{ height: 8, background: '#fafaf8', borderRadius: 100, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(daysProgress / 7) * 100}%`, background: 'linear-gradient(90deg, #4a7c59, #6b9ab8)', borderRadius: 100, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const day = days.find(d => d.day_number === i + 1);
            const isToday = i + 1 === todayDayNum;
            const isDone = day?.status === 'done';
            const isNotDone = day?.status === 'not_done';
            return (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 10, background: isDone ? 'linear-gradient(135deg,#4a7c59,#2d5a3d)' : isNotDone ? 'rgba(248,113,113,0.15)' : isToday ? 'rgba(74,124,89,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isDone ? '#4a7c59' : isNotDone ? '#f87171' : isToday ? 'rgba(74,124,89,0.5)' : '#2d3f5a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: 11, color: isDone ? '#fafaf8' : isToday ? '#4a7c59' : '#94a3b8', animation: isToday && !day ? 'pulse 2s ease-in-out infinite' : 'none' }}>
                {isDone ? '✦' : isNotDone ? '✕' : i + 1}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div onClick={() => setShowCrystalOverlay(true)} style={{ background: '#ffffff', borderRadius: 14, padding: '12px', border: '1px solid #d4cabb', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>💎</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#a78bfa' }}>{clapCount}</div>
          <div style={{ fontSize: 11, color: '#8a8070', fontWeight: 700 }}>魔力の結晶</div>
        </div>
        <div style={{ background: '#ffffff', borderRadius: 14, padding: '12px', border: '1px solid #d4cabb', textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>📅</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#a78bfa' }}>{daysProgress}</div>
          <div style={{ fontSize: 11, color: '#8a8070', fontWeight: 700 }}>修行済み日数</div>
        </div>
      </div>

      {canAddToday && (
        <button onClick={openNewForm} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)', color: '#fafaf8', fontFamily: 'Cinzel, serif', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 0 #2d5a3d', marginBottom: 14 }}>
          ✦ Day {todayDayNum} を記録する
        </button>
      )}
      {todayFilled && !showForm && (
        <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, padding: '11px', marginBottom: 14, textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#34d399', fontWeight: 800 }}>✦ 今日の修行完了！</span>
        </div>
      )}

      {showForm && (
        <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 14, border: '1px solid rgba(74,124,89,0.3)', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#4a7c59', marginBottom: 16 }}>
            {editingDay ? `Day ${editingDay} を編集` : `Day ${todayDayNum} の記録`}
          </div>
          <label style={{ fontSize: 12, color: '#8a8070', fontWeight: 700, display: 'block', marginBottom: 6 }}>今日やったこと</label>
          <textarea value={plan} onChange={e => setPlan(e.target.value)} placeholder="今日何をしましたか..." rows={3}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #d4cabb', background: '#fafaf8', color: '#2c2416', fontSize: 14, fontFamily: 'Nunito, sans-serif', resize: 'none', marginBottom: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
          <label style={{ fontSize: 12, color: '#8a8070', fontWeight: 700, display: 'block', marginBottom: 8 }}>達成度</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {([{ v: 'done' as const, label: '✦ できた！', color: '#34d399', border: '#34d399', bg: 'rgba(52,211,153,0.1)' }, { v: 'not_done' as const, label: '✕ できなかった', color: '#f87171', border: '#f87171', bg: 'rgba(248,113,113,0.1)' }]).map(opt => (
              <button key={opt.v} onClick={() => setStatus(opt.v)}
                style={{ padding: '11px', borderRadius: 10, border: `1.5px solid ${status === opt.v ? opt.border : '#2d3f5a'}`, background: status === opt.v ? opt.bg : 'transparent', color: status === opt.v ? opt.color : '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <label style={{ fontSize: 12, color: '#8a8070', fontWeight: 700, display: 'block', marginBottom: 6 }}>明日の一言（任意）</label>
          <input value={nextStep} onChange={e => setNextStep(e.target.value)} placeholder="明日やること..."
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1px solid #d4cabb', background: '#fafaf8', color: '#2c2416', fontSize: 13, fontFamily: 'Nunito, sans-serif', marginBottom: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
          <label style={{ fontSize: 12, color: '#8a8070', fontWeight: 700, display: 'block', marginBottom: 8 }}>画像（任意）</label>
          {imagePreview ? (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <img src={imagePreview} alt="preview" style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover' }} />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 100, color: '#fff', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          ) : (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: '1px dashed #2d3f5a', cursor: 'pointer', marginBottom: 14, color: '#8a8070', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
              📷 タップして画像を選択
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }} />
            </label>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={closeForm} style={{ padding: '11px', borderRadius: 10, border: '1px solid #d4cabb', background: 'transparent', color: '#8a8070', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>キャンセル</button>
            <button onClick={handleSave} disabled={!plan.trim() || !status || saving}
              style={{ padding: '11px', borderRadius: 10, border: 'none', background: (!plan.trim() || !status || saving) ? '#2d3f5a' : 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: (!plan.trim() || !status || saving) ? '#94a3b8' : '#fafaf8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: (!plan.trim() || !status || saving) ? 'not-allowed' : 'pointer' }}>
              {saving ? '記録中...' : '記録する'}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#8a8070', marginBottom: 10 }}>修行ログ 📜</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const day = days.find(d => d.day_number === i + 1);
            const isToday = i + 1 === todayDayNum;
            const isDone = day?.status === 'done';
            const isNotDone = day?.status === 'not_done';
            return (
              <div key={i}>
                <div
                  onClick={async () => {
                    if (!isDone && !isNotDone) return;
                    console.log('DAY CLICK', i+1, isDone, isNotDone);
                    const { data: allDays } = await supabase
                      .from('mini_challenge_days')
                      .select('day_number, plan, status, image_url')
                      .eq('mini_challenge_id', challengeId)
                      .order('day_number');
                    setResultChallenge({
                      id: challengeId,
                      theme: theme ?? '修行',
                      goal: goal ?? null,
                      started_at: challengeStartedAt ?? new Date(Date.now() - (todayDayNum - 1) * 86400000).toISOString(),
                      days: (allDays ?? []).map((d: any) => ({
                        day_number: d.day_number,
                        plan: d.plan ?? null,
                        status: d.status,
                        image_url: d.image_url ?? null,
                      })),
                    });
                  }}
                  style={{ background: isDone ? 'rgba(74,124,89,0.06)' : isNotDone ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isDone ? 'rgba(74,124,89,0.25)' : isNotDone ? 'rgba(248,113,113,0.25)' : '#2d3f5a'}`, borderRadius: day?.image_url ? '12px 12px 0 0' : 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: !day && !isToday ? 0.4 : 1, cursor: (isDone || isNotDone) ? 'pointer' : 'default' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: isDone ? 'linear-gradient(135deg,#4a7c59,#2d5a3d)' : '#fafaf8', border: `1px solid ${isDone ? '#4a7c59' : isNotDone ? '#f87171' : '#2d3f5a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: 11, color: isDone ? '#fafaf8' : '#94a3b8', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: day ? '#f1f5f9' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>
                    {day?.plan ?? (isToday ? '今日はまだ記録なし' : '未記録')}
                  </div>
                  {day && <button onClick={(e) => { e.stopPropagation(); openEditForm(day); }} style={{ fontSize: 11, color: '#8a8070', background: 'transparent', border: '1px solid #d4cabb', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>編集</button>}
                  <span style={{ fontSize: 13, flexShrink: 0, color: isDone ? '#4a7c59' : '#f87171' }}>{isDone ? '✦' : isNotDone ? '✕' : ''}</span>
                </div>
                {day?.image_url && (
                  <img src={day.image_url} alt="" style={{ width: '100%', borderRadius: '0 0 12px 12px', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#8a8070', marginBottom: 10 }}>仲間の気配 🌙</div>
        {posts.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: 14, padding: '20px', textAlign: 'center', border: '1px solid #d4cabb', color: '#8a8070', fontSize: 13, fontWeight: 700 }}>
            まだ仲間がいません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {posts.slice(0, postsLimit).map((post, idx) => (
              <div key={post.id} style={{ background: '#ffffff', borderRadius: 14, padding: '12px 14px', border: '1px solid #d4cabb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span onClick={() => router.push(`/user/${post.owner_user_id}`)} style={{ fontSize: 13, fontWeight: 800, color: '#a78bfa', fontFamily: 'Nunito, sans-serif', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>
                    {post.nickname}
                  </span>
                  {(() => { const t = getTitle(post.streak_weeks); return <span style={{ fontSize: 10, color: '#8a8070', background: 'rgba(255,255,255,0.05)', borderRadius: 100, padding: '1px 8px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>{t.emoji} {t.title}</span>; })()}
                  {post.mini_titles.includes('comeback_hero') && (
                    <span style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 100, padding: '1px 7px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>🦸</span>
                  )}
                  <span style={{ fontSize: 10, color: '#8a8070', marginLeft: 'auto', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Day {post.day_number}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {post.theme && (
                    <span style={{ fontSize: 10, color: THEMES[post.theme]?.color ?? '#94a3b8', border: `1px solid ${THEMES[post.theme]?.color ?? '#94a3b8'}`, borderRadius: 100, padding: '1px 7px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, flexShrink: 0 }}>
                      {THEMES[post.theme]?.icon} {post.theme}
                    </span>
                  )}
                  {post.goal && <span style={{ fontSize: 12, color: '#cbd5e1', fontFamily: 'Nunito, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.goal}</span>}
                </div>
                <div style={{ fontSize: 13, color: '#2c2416', fontWeight: 700, marginBottom: post.image_url ? 8 : 10, fontFamily: 'Nunito, sans-serif' }}>{post.plan}</div>
                {post.image_url && (
                  <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 180, objectFit: 'cover', marginBottom: 10, display: 'block' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      onClick={() => {
                        const opening = openCommentId !== post.id;
                        setOpenCommentId(opening ? post.id : null);
                        if (opening && post.has_new_comment) {
                          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, has_new_comment: false } : p));
                          // 現在のコメント数をDBから取得して保存
                          supabase.from('post_comments').select('id', { count: 'exact' }).eq('day_id', post.id).neq('user_id', userId ?? '').then(({ count }) => {
                            const readCounts: Record<string, number> = JSON.parse(localStorage.getItem('read_comment_counts') || '{}');
                            readCounts[post.id] = count ?? 0;
                            localStorage.setItem('read_comment_counts', JSON.stringify(readCounts));
                          });
                        }
                      }}
                      style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid #d4cabb', background: openCommentId === post.id ? 'rgba(125,211,252,0.1)' : 'transparent', color: openCommentId === post.id ? '#7dd3fc' : '#94a3b8', fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                      💬 コメント
                    </button>
                    {post.has_new_comment && (
                      <span style={{ position: 'absolute', top: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: '#f87171', border: '1.5px solid #0f1729', display: 'block', transform: 'translate(30%, -30%)' }} />
                    )}
                  </div>
                  <button onClick={() => !post.already_checked && handleCheck(post.id, idx)}
                    style={{ padding: '5px 14px', borderRadius: 100, border: `1px solid ${post.already_checked ? 'rgba(52,211,153,0.4)' : 'rgba(167,139,250,0.4)'}`, background: post.already_checked ? 'rgba(52,211,153,0.08)' : 'rgba(167,139,250,0.08)', color: post.already_checked ? '#34d399' : '#a78bfa', fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 800, cursor: post.already_checked ? 'default' : 'pointer' }}>
                    {post.already_checked ? `✦ 応援した (${post.check_count})` : `✧ 応援する (${post.check_count})`}
                  </button>
                </div>
                {openCommentId === post.id && userId && (
                  <CommentSection key={post.id} postId={post.id} myUserId={userId} />
                )}
              </div>
            ))}
          </div>
        )}
        {posts.length > postsLimit && commentedUsersCount >= 5 && (
          <button
            onClick={() => setPostsLimit(l => l + 5)}
            style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid #d4cabb', background: 'transparent', color: '#8a8070', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
          >
            ▼ もっと見る →
          </button>
        )}
        {postsLimit > 5 && (
          <button
            onClick={() => setPostsLimit(5)}
            style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: 12, border: '1px solid #d4cabb', background: 'transparent', color: '#4a5568', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            ▲ 折りたたむ
          </button>
        )}
      </div>

      <button onClick={handleClap} disabled={clapped}
        style={{ width: '100%', padding: '15px', borderRadius: 14, border: `1px solid ${clapped ? 'rgba(52,211,153,0.3)' : 'rgba(167,139,250,0.4)'}`, background: clapped ? 'rgba(52,211,153,0.07)' : 'rgba(167,139,250,0.08)', color: clapped ? '#34d399' : '#a78bfa', fontFamily: 'Cinzel, serif', fontSize: 14, cursor: clapped ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>💎</span>
        {clapped ? `魔力で応援した！(${clapCount})` : `魔力で応援する (${clapCount})`}
      </button>
      {resultChallenge && (
        <ResultDetailModal
          challenge={resultChallenge}
          onClose={() => setResultChallenge(null)}
        />
      )}
      {showHatModal && (
        <HatModal onDismiss={() => {
          localStorage.setItem('hat_shown', '1');
          setShowHatModal(false);
        }} />
      )}
      {showCrystalOverlay && (
        <div
          onClick={() => setShowCrystalOverlay(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(4,8,20,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'overlayIn 0.3s ease', padding: 32 }}
        >
          <div style={{ animation: 'floatUp 3s ease-in-out infinite', marginBottom: 24, position: 'relative' }}>
            <div style={{ fontSize: 72, lineHeight: 1 }}>💎</div>
            <div style={{ position: 'absolute', top: -8, right: -12, fontSize: 18, animation: 'sparkle 1.5s ease-in-out infinite' }}>✦</div>
            <div style={{ position: 'absolute', bottom: -4, left: -14, fontSize: 14, animation: 'sparkle 2s ease-in-out infinite 0.5s' }}>✧</div>
            <div style={{ position: 'absolute', top: 4, left: -16, fontSize: 12, animation: 'sparkle 1.8s ease-in-out infinite 1s' }}>✦</div>
          </div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#a78bfa', letterSpacing: 4, marginBottom: 12, textTransform: 'uppercase' }}>Coming Soon</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#4a7c59', textAlign: 'center', lineHeight: 1.5, marginBottom: 12, textShadow: '0 0 20px rgba(74,124,89,0.5)' }}>
            魔力の結晶が<br />動き出す日が近い
          </div>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#8a8070', textAlign: 'center', lineHeight: 1.8, marginBottom: 32 }}>
            仲間と力を合わせて使う<br />大いなる魔法が準備中です。<br />今はその力をためておこう。
          </div>
          <div style={{ width: 48, height: 2, background: 'linear-gradient(90deg,transparent,#a78bfa,transparent)', marginBottom: 24 }} />
          <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#4a5568', fontWeight: 700 }}>タップで閉じる</div>
        </div>
      )}
    </div>
  );
}
