'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAuth, getProfile, deleteMyAccount, getBlockList, unblockUser } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type BlockedUser = { userId: string; nickname: string };

export default function SettingsPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [blockList, setBlockList] = useState<BlockedUser[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const user = await ensureAuth();
      if (!user) return;
      setUserId(user.id);
      const [profile, blocks] = await Promise.all([
        getProfile(user.id),
        getBlockList(),
      ]);
      setNickname(profile?.nickname ?? '');
      setBlockList(blocks);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveNickname() {
    if (!newNickname.trim()) { setNicknameError('名前を入力してください'); return; }
    if (newNickname.length > 10) { setNicknameError('10文字以内で入力してください'); return; }
    if (!userId) return;
    setSavingNickname(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({ nickname: newNickname.trim() })
      .eq('user_id', userId);
    if (error) {
      setNicknameError('保存に失敗しました');
      setSavingNickname(false);
      return;
    }
    setNickname(newNickname.trim());
    setEditingNickname(false);
    setNewNickname('');
    setNicknameError('');
    setSavingNickname(false);
  }

  async function handleUnblock(uid: string) {
    setUnblocking(uid);
    await unblockUser(uid);
    setBlockList(prev => prev.filter(b => b.userId !== uid));
    setUnblocking(null);
  }

  async function handleDelete() {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    await deleteMyAccount();
    // アカウント削除時はonboarding関連のlocalStorageも全消去
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_done');
      localStorage.removeItem('ichiji_broom_received');
    }
    router.replace('/');
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ fontFamily: 'Lora, serif', fontSize: 24, color: '#2d5a3d' }}>やわらかの旅</div>
    </div>
  );

  return (
    <div style={{ paddingTop: 24 }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid #2d3f5a', borderRadius: 10, padding: '8px 14px', color: '#94a3b8', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
          ← 戻る
        </button>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#f0c040', textShadow: '0 0 15px rgba(240,192,64,0.4)' }}>設定</div>
      </div>

      {/* ニックネーム */}
      <div style={{ background: '#1e2d4a', borderRadius: 16, padding: '16px 18px', marginBottom: 14, border: '1px solid #2d3f5a', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 10, fontFamily: 'Nunito, sans-serif' }}>ニックネーム</div>
        {!editingNickname ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#f1f5f9' }}>{nickname}</div>
            <button
              onClick={() => { setNewNickname(nickname); setEditingNickname(true); setNicknameError(''); }}
              style={{ padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(240,192,64,0.4)', background: 'rgba(240,192,64,0.08)', color: '#f0c040', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              編集
            </button>
          </div>
        ) : (
          <div>
            <input
              value={newNickname}
              onChange={e => { setNewNickname(e.target.value); setNicknameError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSaveNickname()}
              maxLength={10}
              autoFocus
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1.5px solid ${nicknameError ? '#f87171' : '#f0c040'}`, background: '#0f1729', color: '#f1f5f9', fontSize: 15, fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginBottom: 6, boxSizing: 'border-box' as const, outline: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700 }}>{nicknameError}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{newNickname.length}/10</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => { setEditingNickname(false); setNicknameError(''); }}
                style={{ padding: '10px', borderRadius: 10, border: '1px solid #2d3f5a', background: 'transparent', color: '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveNickname}
                disabled={!newNickname.trim() || savingNickname}
                style={{ padding: '10px', borderRadius: 10, border: 'none', background: newNickname.trim() ? 'linear-gradient(135deg,#f0c040,#c49a20)' : '#2d3f5a', color: newNickname.trim() ? '#0f1729' : '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: newNickname.trim() ? 'pointer' : 'not-allowed', boxShadow: newNickname.trim() ? '0 3px 0 #8a6000' : 'none' }}
              >
                {savingNickname ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ブロックリスト */}
      <div style={{ background: '#1e2d4a', borderRadius: 16, padding: '16px 18px', marginBottom: 14, border: '1px solid #2d3f5a', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#f0c040', marginBottom: 12 }}>🚫 ブロックリスト</div>
        {blockList.length === 0 ? (
          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>ブロックしているユーザーはいません</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {blockList.map(b => (
              <div key={b.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f1729', borderRadius: 10, padding: '10px 14px', border: '1px solid #2d3f5a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/sun.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{b.nickname}</span>
                </div>
                <button
                  onClick={() => handleUnblock(b.userId)}
                  disabled={unblocking === b.userId}
                  style={{ padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  {unblocking === b.userId ? '...' : '解除する'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アカウント削除 */}
      <div style={{ background: '#1e2d4a', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(248,113,113,0.2)', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#f87171', marginBottom: 8 }}>アカウント削除</div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 14, lineHeight: 1.7 }}>
          全ての修行記録・コメント・プロフィールが削除されます。この操作は取り消せません。
        </div>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)', color: '#f87171', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            🗑️ アカウントを削除する
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: '#f87171', fontWeight: 800, marginBottom: 10 }}>確認のため「DELETE」と入力してください</div>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1.5px solid ${deleteInput === 'DELETE' ? '#f87171' : '#2d3f5a'}`, background: '#0f1729', color: '#f1f5f9', fontSize: 14, fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginBottom: 12, boxSizing: 'border-box' as const, outline: 'none' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} style={{ padding: '10px', borderRadius: 10, border: '1px solid #2d3f5a', background: 'transparent', color: '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleDelete} disabled={deleteInput !== 'DELETE' || deleting} style={{ padding: '10px', borderRadius: 10, border: 'none', background: deleteInput === 'DELETE' ? '#f87171' : '#2d3f5a', color: deleteInput === 'DELETE' ? '#fff' : '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed' }}>
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
