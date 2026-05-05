'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getUserProfile, getUserChallengeHistory, getUserStreakWeeks,
  getTitle, blockUser, unblockUser, isBlocked, ensureAuth,
  getMyProfile, getUserMiniTitles, useIchijiBroom,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import ResultDetailModal, { ChallengeResult } from '@/app/components/ResultDetailModal';
import AncientWallButton from '@/app/components/AncientWallButton';

type ChallengeComment = {
  id: string;
  user_id: string;
  nickname: string;
  body: string;
  reply_to: string | null;
  created_at: string;
  day_number: number;
  day_id: string;
};

const THEMES: Record<string, { icon: string; color: string }> = {
  '健康': { icon: '💊', color: '#34d399' },
  'お金': { icon: '🪙', color: '#f0c040' },
  '夢': { icon: '🔮', color: '#a78bfa' },
  'キャリア': { icon: '📜', color: '#7dd3fc' },
  '人間関係': { icon: '🫂', color: '#fda4af' },
  'その他': { icon: '🧪', color: '#94a3b8' },
};

type Challenge = { id: string; theme: string | null; goal: string | null; status: string; started_at: string; done: number; total: number; };

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;

  const [nickname, setNickname] = useState<string | null>(null);
  const [history, setHistory] = useState<Challenge[]>([]);
  const [streakWeeks, setStreakWeeks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [openHistoryCommentId, setOpenHistoryCommentId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, ChallengeComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyTargets, setReplyTargets] = useState<Record<string, { id: string; nickname: string } | null>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string>('');
  const [myItems, setMyItems] = useState<string[]>([]);
  const [myMiniTitles, setMyMiniTitles] = useState<string[]>([]);
  const [targetMiniTitles, setTargetMiniTitles] = useState<string[]>([]);
  const [broomUsing, setBroomUsing] = useState(false);
  const [broomResult, setBroomResult] = useState<string | null>(null);
  const [resultModal, setResultModal] = useState<ChallengeResult | null>(null);

  useEffect(() => {
    async function load() {
      const [profile, hist, weeks, blockedStatus, me] = await Promise.all([
        getUserProfile(uid),
        getUserChallengeHistory(uid),
        getUserStreakWeeks(uid),
        isBlocked(uid),
        ensureAuth(),
      ]);
      setNickname(profile?.nickname ?? '匿名');
      setHistory(hist);
      setStreakWeeks(weeks);
      setBlocked(blockedStatus);
      setIsSelf(me?.id === uid);
      setMyUserId(me?.id ?? null);
      if (me?.id) {
        const { data: myProf } = await supabase.from('user_profiles').select('nickname').eq('user_id', me.id).maybeSingle();
        setMyNickname(myProf?.nickname ?? '匿名');
      }
      const targetMini = await getUserMiniTitles(uid);
      setTargetMiniTitles(targetMini);
      if (me?.id === uid) {
        const myProf = await getMyProfile();
        setMyItems(myProf?.items ?? []);
        setMyMiniTitles(myProf?.mini_titles ?? []);
      }
      setLoading(false);
    }
    load();
  }, [uid]);

  async function loadChallengeComments(challengeId: string) {
    if (commentsMap[challengeId]) {
      // トグル
      setOpenHistoryCommentId(openHistoryCommentId === challengeId ? null : challengeId);
      return;
    }
    setLoadingComments(challengeId);
    // そのチャレンジの全day_idを取得
    const { data: days } = await supabase
      .from('mini_challenge_days')
      .select('id, day_number')
      .eq('mini_challenge_id', challengeId)
      .order('day_number', { ascending: true });
    if (!days || days.length === 0) {
      setCommentsMap(prev => ({ ...prev, [challengeId]: [] }));
      setOpenHistoryCommentId(challengeId);
      setLoadingComments(null);
      return;
    }
    const dayIds = days.map((d: any) => d.id);
    const dayNumberMap: Record<string, number> = {};
    days.forEach((d: any) => { dayNumberMap[d.id] = d.day_number; });

    const { data: comments } = await supabase
      .from('post_comments')
      .select('id, user_id, nickname, body, reply_to, created_at, day_id')
      .in('day_id', dayIds)
      .order('created_at', { ascending: true });

    const enriched: ChallengeComment[] = (comments ?? []).map((c: any) => ({
      ...c,
      day_number: dayNumberMap[c.day_id] ?? 0,
    }));
    setCommentsMap(prev => ({ ...prev, [challengeId]: enriched }));
    setOpenHistoryCommentId(challengeId);
    setLoadingComments(null);
  }

  async function sendHistoryReply(challengeId: string, dayId: string) {
    const body = (replyInputs[dayId] ?? '').trim();
    if (!body || !myUserId) return;
    setSendingReply(dayId);
    const replyTo = replyTargets[dayId]?.id ?? null;
    await supabase.from('post_comments').insert({
      day_id: dayId,
      user_id: myUserId,
      nickname: myNickname,
      body,
      reply_to: replyTo,
    });
    // コメント再取得
    const { data: days } = await supabase
      .from('mini_challenge_days')
      .select('id, day_number')
      .eq('mini_challenge_id', challengeId)
      .order('day_number', { ascending: true });
    const dayIds = (days ?? []).map((d: any) => d.id);
    const dayNumberMap: Record<string, number> = {};
    (days ?? []).forEach((d: any) => { dayNumberMap[d.id] = d.day_number; });
    const { data: comments } = await supabase
      .from('post_comments')
      .select('id, user_id, nickname, body, reply_to, created_at, day_id')
      .in('day_id', dayIds)
      .order('created_at', { ascending: true });
    const enriched: ChallengeComment[] = (comments ?? []).map((c: any) => ({
      ...c,
      day_number: dayNumberMap[c.day_id] ?? 0,
    }));
    setCommentsMap(prev => ({ ...prev, [challengeId]: enriched }));
    setReplyInputs(prev => ({ ...prev, [dayId]: '' }));
    setReplyTargets(prev => ({ ...prev, [dayId]: null }));
    setSendingReply(null);
  }

  async function handleUseBroom() {
    setBroomUsing(true);
    const result = await useIchijiBroom();
    if (result === 'ok') {
      setMyItems(prev => prev.filter(i => i !== 'ichiji_broom'));
      setMyMiniTitles(prev => [...prev, 'comeback_hero']);
      setTargetMiniTitles(prev => [...prev, 'comeback_hero']);
      setBroomResult('カムバック・ヒーローの称号を獲得しました！ 🦸');
    } else if (result === 'already_used') {
      setBroomResult('すでにカムバック・ヒーローです！');
    } else {
      setBroomResult('アイテムがありません');
    }
    setBroomUsing(false);
  }

  async function openResultModal(c: Challenge) {
    const { data: days } = await supabase
      .from('mini_challenge_days')
      .select('day_number, plan, status, image_url')
      .eq('mini_challenge_id', c.id)
      .order('day_number', { ascending: true });
    setResultModal({
      id: c.id,
      theme: c.theme ?? 'その他',
      goal: c.goal,
      started_at: c.started_at,
      days: days ?? [],
    });
  }

  async function handleBlock() {
    setBlockLoading(true);
    if (blocked) {
      await unblockUser(uid);
      setBlocked(false);
    } else {
      await blockUser(uid);
      setBlocked(true);
    }
    setShowBlockConfirm(false);
    setBlockLoading(false);
  }

  const titleData = getTitle(streakWeeks);
  const completedChallenges = history.filter(c => c.status === 'done');
  const totalDone = completedChallenges.reduce((acc, c) => acc + c.done, 0);
  const totalDays = completedChallenges.reduce((acc, c) => acc + c.total, 0);
  const overallRate = totalDays > 0 ? Math.round((totalDone / totalDays) * 100) : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f3ed' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 24, color: '#2d5a3d', marginBottom: 12 }}>やわらかの旅</div>
        <div style={{ color: '#8a8070', fontSize: 14, fontFamily: 'Nunito, sans-serif' }}>記録を読み解いております...</div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 24, background: '#f7f3ed', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes goldPulse { 0%,100% { box-shadow:0 0 10px rgba(74,124,89,0.15), inset 0 1px 0 rgba(74,124,89,0.1); } 50% { box-shadow:0 0 24px rgba(74,124,89,0.35), inset 0 1px 0 rgba(74,124,89,0.2); } }
        @keyframes torchFlicker { 0%,100% { opacity:1; } 45% { opacity:0.85; } 55% { opacity:0.95; } }
        .stone-card { background: linear-gradient(160deg, #faf7f2 0%, #ffffff 60%, #f0ebe2 100%); border: 1px solid #d4cabb; position: relative; overflow: hidden; }
        .stone-card::before { content:''; position:absolute; inset:0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(74,124,89,0.015) 2px, rgba(74,124,89,0.015) 4px); pointer-events:none; }
        .stone-card::after { content:''; position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, rgba(74,124,89,0.4), transparent); }
        .corner-ornament { position:absolute; width:16px; height:16px; border-color:#d4cabb; border-style:solid; }
        .stat-stone { background: linear-gradient(135deg, #f0ebe2 0%, #f7f3ed 100%); border: 1px solid #d4cabb; position: relative; }
        .stat-stone::after { content:''; position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, rgba(74,124,89,0.3), transparent); }
        .history-rune { background: linear-gradient(160deg, #faf7f2 0%, #f0ebe2 100%); border: 1px solid #d4cabb; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
        .history-rune:hover { border-color: #4a7c59; transform: translateY(-1px); }
        .history-rune-done { border-color: rgba(74,124,89,0.4); }
        .history-rune-active { border-color: rgba(90,200,120,0.35); }
        .divider-rune { height:1px; background: linear-gradient(90deg, transparent, #d4cabb, rgba(74,124,89,0.4), #d4cabb, transparent); margin: 16px 0; }
        .comment-input { background: #f7f3ed !important; border: 1px solid #d4cabb !important; color: #2c2416 !important; border-radius: 6px !important; font-family: 'Nunito', sans-serif !important; }
        .comment-input:focus { border-color: #4a7c59 !important; outline: none !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #d4cabb' }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid #d4cabb', borderRadius: 4, padding: '7px 14px', color: '#8a8070', fontSize: 12, fontFamily: 'Lora, serif', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em', transition: 'color 0.2s, border-color 0.2s' }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#4a7c59'; (e.target as HTMLButtonElement).style.borderColor = '#4a7c59'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#8a8070'; (e.target as HTMLButtonElement).style.borderColor = '#d4cabb'; }}
        >← 戻る</button>
        <div style={{ fontFamily: 'Lora, serif', fontSize: 18, color: '#2d5a3d' }}>やわらかの旅</div>
      </div>

      {/* ═══ 英雄の石碑 プロフィールカード ═══ */}
      <div className="stone-card" style={{ borderRadius: 4, padding: '28px 20px 24px', marginBottom: 16, textAlign: 'center', animation: 'fadeUp 0.3s ease', animationName: 'goldPulse', animationDuration: '3s', animationIterationCount: 'infinite' }}>
        {/* 四隅の装飾 */}
        <div className="corner-ornament" style={{ top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 0, borderRightWidth: 0 }} />
        <div className="corner-ornament" style={{ top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2, borderBottomWidth: 0, borderLeftWidth: 0 }} />
        <div className="corner-ornament" style={{ bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2, borderTopWidth: 0, borderRightWidth: 0 }} />
        <div className="corner-ornament" style={{ bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2, borderTopWidth: 0, borderLeftWidth: 0 }} />

        {/* 石碑タイトル */}
        <div style={{ fontFamily: 'Lora, serif', fontSize: 9, color: '#8a8070', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 18 }}>
          ─── 英雄の石碑 ───
        </div>

        {/* キャラクター画像 */}
        <div style={{ marginBottom: 16 }}>
          <img
            src={`https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/sun.png`}
            alt={titleData.title}
            style={{ width: 140, height: 140, objectFit: 'contain', objectPosition: 'center', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}
          />
        </div>

        {/* ニックネーム */}
        <div style={{ fontFamily: 'Lora, serif', fontSize: 26, color: '#2c2416', marginBottom: 10, letterSpacing: '0.08em', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{nickname}</div>

        {/* 称号バッジ */}
        <div style={{ display: 'inline-block', background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.45)', borderRadius: 2, padding: '5px 20px', fontFamily: 'Lora, serif', fontSize: 12, color: '#4a7c59', letterSpacing: '0.08em', marginBottom: targetMiniTitles.includes('comeback_hero') ? 8 : 20 }}>
          {titleData.emoji} {titleData.title}
        </div>

        {targetMiniTitles.includes('comeback_hero') && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ display: 'inline-block', background: 'rgba(138,90,130,0.15)', border: '1px solid rgba(138,90,130,0.4)', borderRadius: 2, padding: '4px 14px', fontFamily: 'Lora, serif', fontSize: 10, color: '#b07aaa', letterSpacing: '0.08em' }}>
              🦸 カムバック・ヒーロー
            </span>
          </div>
        )}

        {/* 区切り */}
        <div className="divider-rune" />

        {/* ステータス石板 3列 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: isSelf ? 0 : 20 }}>
          <div className="stat-stone" style={{ borderRadius: 3, padding: '12px 6px' }}>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: '#4a7c59', textShadow: '0 0 10px rgba(74,124,89,0.3)' }}>{streakWeeks}</div>
            <div style={{ fontSize: 9, color: '#8a8070', fontFamily: 'Lora, serif', marginTop: 4, letterSpacing: '0.05em' }}>連続週数</div>
          </div>
          <div className="stat-stone" style={{ borderRadius: 3, padding: '12px 6px' }}>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: '#4a7c59', textShadow: '0 0 10px rgba(74,124,89,0.3)' }}>{completedChallenges.length}</div>
            <div style={{ fontSize: 9, color: '#8a8070', fontFamily: 'Lora, serif', marginTop: 4, letterSpacing: '0.05em' }}>完了修行</div>
          </div>
          <div className="stat-stone" style={{ borderRadius: 3, padding: '12px 6px' }}>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 22, color: '#4a7c59', textShadow: '0 0 10px rgba(74,124,89,0.3)' }}>{overallRate}%</div>
            <div style={{ fontSize: 9, color: '#8a8070', fontFamily: 'Lora, serif', marginTop: 4, letterSpacing: '0.05em' }}>達成率</div>
          </div>
        </div>

        {/* アイテムセクション（自分のみ） */}
        {isSelf && (myItems.length > 0 || myMiniTitles.includes('comeback_hero')) && (
          <div style={{ marginTop: 20 }}>
            <div className="divider-rune" />
            <div style={{ fontSize: 9, color: '#8a8070', letterSpacing: '0.25em', marginBottom: 12, fontFamily: 'Lora, serif', textTransform: 'uppercase' }}>
              ✦ 所持アイテム
            </div>
            {myItems.includes('ichiji_broom') && (
              <div style={{ background: 'rgba(74,124,89,0.04)', border: '1px solid rgba(74,124,89,0.2)', borderRadius: 3, padding: '14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '22px', animation: 'torchFlicker 2s infinite' }}>🧹</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: 13, color: '#4a7c59', letterSpacing: '0.05em' }}>イチジホウキ</div>
                    <div style={{ fontSize: 10, color: '#8a8070', marginTop: 2, fontFamily: 'Nunito, sans-serif' }}>早期登録・初回特典アイテム</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8a8070', fontFamily: 'Nunito, sans-serif', lineHeight: 1.6, marginBottom: 10 }}>
                  使うと「カムバック・ヒーロー」のミニ称号が付与されます。
                </div>
                {broomResult ? (
                  <div style={{ fontSize: 12, color: '#4a7c59', fontFamily: 'Nunito, sans-serif', padding: '8px', background: 'rgba(74,124,89,0.06)', border: '1px solid rgba(74,124,89,0.2)', borderRadius: 3, textAlign: 'center' }}>
                    {broomResult}
                  </div>
                ) : (
                  <button
                    onClick={handleUseBroom}
                    disabled={broomUsing}
                    style={{ width: '100%', padding: '10px', borderRadius: 3, border: '1px solid #4a7c59', background: 'linear-gradient(135deg, rgba(74,124,89,0.15), rgba(45,90,61,0.25))', color: '#4a7c59', fontFamily: 'Lora, serif', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', transition: 'background 0.2s' }}
                  >
                    {broomUsing ? '使用中...' : '✦ ホウキを使う'}
                  </button>
                )}
              </div>
            )}
            {myMiniTitles.includes('comeback_hero') && (
              <div style={{ background: 'rgba(138,90,130,0.06)', border: '1px solid rgba(138,90,130,0.25)', borderRadius: 3, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '20px' }}>🦸</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: 'Lora, serif', fontSize: 12, color: '#b07aaa', letterSpacing: '0.05em' }}>カムバック・ヒーロー</div>
                  <div style={{ fontSize: 10, color: '#8a8070', marginTop: 2, fontFamily: 'Nunito, sans-serif' }}>ミニ称号 · 適度な休息の証</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ブロックボタン（自分以外） */}
        {!isSelf && (
          <div style={{ marginTop: 20 }}>
            <div className="divider-rune" />
            {showBlockConfirm ? (
              <div style={{ background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.25)', borderRadius: 3, padding: '14px' }}>
                <div style={{ fontSize: 12, color: '#c07070', fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>
                  {blocked ? `${nickname}のブロックを解除しますか？` : `${nickname}をブロックしますか？`}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => setShowBlockConfirm(false)} style={{ padding: '9px', borderRadius: 3, border: '1px solid #d4cabb', background: 'transparent', color: '#8a8070', fontFamily: 'Lora, serif', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}>キャンセル</button>
                  <button onClick={handleBlock} disabled={blockLoading} style={{ padding: '9px', borderRadius: 3, border: 'none', background: blocked ? 'rgba(90,160,100,0.2)' : 'rgba(180,60,60,0.15)', color: blocked ? '#80c090' : '#c07070', fontFamily: 'Lora, serif', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}>
                    {blockLoading ? '処理中...' : blocked ? '解除する' : 'ブロック'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowBlockConfirm(true)} style={{ padding: '7px 20px', borderRadius: 2, border: `1px solid ${blocked ? 'rgba(90,160,100,0.35)' : 'rgba(180,60,60,0.25)'}`, background: 'transparent', color: blocked ? '#80c090' : '#c07070', fontFamily: 'Lora, serif', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em' }}>
                {blocked ? '✦ ブロック済み（解除する）' : '× ブロックする'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══ 修行履歴（年代記） ═══ */}
      <div style={{ animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #d4cabb)' }} />
          <div style={{ fontFamily: 'Lora, serif', fontSize: 10, color: '#8a8070', letterSpacing: '0.25em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>⊞ 修行履歴</div>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #d4cabb, transparent)' }} />
        </div>

        {history.length > 0 && (
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
            <AncientWallButton challengeId={history[0].id} />
          </div>
        )}

        {history.length === 0 ? (
          <div className="stone-card" style={{ borderRadius: 4, padding: '24px', textAlign: 'center', color: '#8a8070', fontSize: 13, fontFamily: 'Lora, serif', letterSpacing: '0.05em' }}>
            まだ修行記録がありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((c, i) => {
              const themeData = c.theme ? THEMES[c.theme] : null;
              const isCompleted = c.status === 'done';
              const isActive = c.status === 'active';
              const date = new Date(c.started_at);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
              return (
                <div key={c.id} onClick={() => openResultModal(c)}
                  className={`history-rune${isCompleted ? ' history-rune-done' : isActive ? ' history-rune-active' : ''}`}
                  style={{ borderRadius: 4, padding: '14px', opacity: i > 5 ? 0.65 : 1, position: 'relative' }}
                >
                  {/* 完了マーク（右上） */}
                  {isCompleted && <div style={{ position: 'absolute', top: 8, right: 8, fontFamily: 'Lora, serif', fontSize: 9, color: '#4a7c59', letterSpacing: '0.1em' }}>✦ 完了</div>}
                  {isActive && <div style={{ position: 'absolute', top: 8, right: 8, fontFamily: 'Lora, serif', fontSize: 9, color: '#7ab87a', letterSpacing: '0.1em' }}>修行中</div>}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {themeData && (
                      <span style={{ fontSize: 10, fontFamily: 'Lora, serif', color: '#8a8070', padding: '2px 8px', border: '1px solid #d4cabb', background: 'rgba(212,202,187,0.5)', flexShrink: 0, letterSpacing: '0.05em' }}>
                        {c.theme}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#8a8070', fontFamily: 'Lora, serif', marginLeft: 'auto', flexShrink: 0, paddingRight: isCompleted || isActive ? 44 : 0 }}>{dateStr}〜</span>
                  </div>

                  {c.goal && <div style={{ fontSize: 14, fontWeight: 700, color: '#2c2416', fontFamily: 'Nunito, sans-serif', marginBottom: 10, lineHeight: 1.5 }}>{c.goal}</div>}

                  {/* 進捗バー（石板刻み風） */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: '#f7f3ed', border: '1px solid #d4cabb', borderRadius: 0, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.done / 7) * 100}%`, background: c.done === 7 ? 'linear-gradient(90deg,#4a7c59,#6ba37a)' : 'linear-gradient(90deg,#2d5a3d,#4a7c59)', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: 11, color: '#4a7c59', flexShrink: 0 }}>{c.done}<span style={{ fontSize: 9, color: '#8a8070' }}>/7</span></div>
                  </div>

                  {/* コメントボタン */}
                  <button
                    onClick={(e) => { e.stopPropagation(); loadChallengeComments(c.id); }}
                    style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 2, border: '1px solid #d4cabb', background: openHistoryCommentId === c.id ? 'rgba(74,124,89,0.06)' : 'transparent', color: openHistoryCommentId === c.id ? '#4a7c59' : '#8a8070', fontFamily: 'Lora, serif', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em' }}
                  >
                    {loadingComments === c.id ? '読み込み中...' : openHistoryCommentId === c.id ? '▲ 閉じる' : '◈ 伝言を見る'}
                  </button>

                  {openHistoryCommentId === c.id && commentsMap[c.id] !== undefined && (
                    <div style={{ marginTop: 10, borderTop: '1px solid #d4cabb', paddingTop: 10 }}>
                      {commentsMap[c.id].length === 0 ? (
                        <p style={{ fontSize: 12, color: '#8a8070', fontFamily: 'Nunito, sans-serif', margin: 0 }}>伝言はありません</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {commentsMap[c.id].map(cm => (
                            <div key={cm.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 9, color: '#d4cabb', fontFamily: 'Lora, serif', letterSpacing: '0.05em' }}>Day {cm.day_number}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#4a7c59', fontFamily: 'Lora, serif', letterSpacing: '0.04em' }}>{cm.nickname}</span>
                                {myUserId && (
                                  <button
                                    onClick={() => setReplyTargets(prev => ({ ...prev, [cm.day_id]: prev[cm.day_id]?.id === cm.id ? null : { id: cm.id, nickname: cm.nickname } }))}
                                    style={{ fontSize: 10, color: replyTargets[cm.day_id]?.id === cm.id ? '#4a7c59' : '#8a8070', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Lora, serif', fontWeight: 700, marginLeft: 'auto', letterSpacing: '0.05em' }}
                                  >{replyTargets[cm.day_id]?.id === cm.id ? '✕' : '返信'}</button>
                                )}
                              </div>
                              {cm.reply_to && (
                                <span style={{ fontSize: 11, color: '#8a8070', fontFamily: 'Nunito, sans-serif', marginLeft: 8 }}>
                                  @{commentsMap[c.id].find(x => x.id === cm.reply_to)?.nickname ?? ''}
                                </span>
                              )}
                              <span style={{ fontSize: 13, color: '#2c2416', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>{cm.body}</span>
                              {myUserId && replyTargets[cm.day_id]?.id === cm.id && (
                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                  <input
                                    className="comment-input"
                                    value={replyInputs[cm.day_id] ?? ''}
                                    onChange={e => setReplyInputs(prev => ({ ...prev, [cm.day_id]: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && sendHistoryReply(c.id, cm.day_id)}
                                    placeholder={`${cm.nickname}へ返信...`}
                                    maxLength={50}
                                    style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
                                  />
                                  <button
                                    onClick={() => sendHistoryReply(c.id, cm.day_id)}
                                    disabled={!(replyInputs[cm.day_id] ?? '').trim() || sendingReply === cm.day_id}
                                    style={{ padding: '7px 12px', borderRadius: 3, border: '1px solid', borderColor: (replyInputs[cm.day_id] ?? '').trim() ? '#4a7c59' : '#d4cabb', background: (replyInputs[cm.day_id] ?? '').trim() ? 'rgba(74,124,89,0.15)' : 'transparent', color: (replyInputs[cm.day_id] ?? '').trim() ? '#4a7c59' : '#8a8070', fontFamily: 'Lora, serif', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >{sendingReply === cm.day_id ? '...' : '送信'}</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {myUserId && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          <input
                            className="comment-input"
                            value={replyInputs[`new_${c.id}`] ?? ''}
                            onChange={e => setReplyInputs(prev => ({ ...prev, [`new_${c.id}`]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { const dayId = commentsMap[c.id][commentsMap[c.id].length - 1]?.day_id; if (dayId) sendHistoryReply(c.id, dayId); } }}
                            placeholder="伝言を刻む..."
                            maxLength={50}
                            style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
                          />
                          <button
                            onClick={() => { const dayId = commentsMap[c.id][commentsMap[c.id].length - 1]?.day_id; if (dayId) { setReplyInputs(prev => ({ ...prev, [dayId]: prev[`new_${c.id}`] ?? '' })); sendHistoryReply(c.id, dayId); setReplyInputs(prev => ({ ...prev, [`new_${c.id}`]: '' })); } }}
                            disabled={!(replyInputs[`new_${c.id}`] ?? '').trim()}
                            style={{ padding: '7px 12px', borderRadius: 3, border: '1px solid', borderColor: (replyInputs[`new_${c.id}`] ?? '').trim() ? '#4a7c59' : '#d4cabb', background: (replyInputs[`new_${c.id}`] ?? '').trim() ? 'rgba(74,124,89,0.15)' : 'transparent', color: (replyInputs[`new_${c.id}`] ?? '').trim() ? '#4a7c59' : '#8a8070', fontFamily: 'Lora, serif', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >刻む</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {resultModal && (
        <ResultDetailModal
          challenge={resultModal}
          onClose={() => setResultModal(null)}
        />
      )}
    </div>
  );
}
