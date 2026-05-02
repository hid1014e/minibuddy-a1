'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Day {
  mini_challenge_id: string;
  day_number: number;
  plan: string;
  status: string;
  next_step: string | null;
  image_url: string | null;
  updated_at: string;
}

interface Challenge {
  id: string;
  theme: string;
  goal: string;
  status: string;
  started_at: string;
  owner_user_id: string;
}

interface Profile {
  user_id: string;
  nickname: string;
  mini_titles: string[] | null;
}

interface Props {
  challenges: Challenge[];
  daysMap: Record<string, Day[]>;
  profileMap: Record<string, Profile>;
}

const MONKEY_COMMENT = (doneDays: number) => {
  if (doneDays === 7) return '7日やり切ったな。\n習慣の入口に片足突っ込んだぞ。\n次の7日も同じ感覚でいけば、\nお前の人生変わるわ。';
  if (doneDays >= 5) return '週4日以上が習慣化の鍵！\n良い調子ですっ';
  if (doneDays >= 3) return 'もう少しだけ目標の負荷を\n下げても良いかもですね！';
  return 'ウキ…始めたことは偉い。\nでも次はもっと頑張れよ！';
};

const HIEROGLYPHS = ['𓂀', '𓃒', '𓅃', '𓆣', '𓇯', '𓈖', '𓊪', '𓋴', '𓌀', '𓍢'];

const THEMES: Record<string, { label: string; color: string }> = {
  '健康': { label: '✚ 健康', color: '#a8c8a0' },
  'お金': { label: '◎ お金', color: '#c5a059' },
  '夢':   { label: '◈ 夢',   color: '#a090c8' },
  'キャリア': { label: '⊞ キャリア', color: '#90b8c8' },
  '人間関係': { label: '◇ 人間関係', color: '#c8a0a8' },
  'その他': { label: '◆ その他', color: '#909090' },
};

/* ── Shared style tokens ── */
const S = {
  bgDark:    '#2a2824',
  bgMedium:  '#3d3a33',
  parchment: '#c8b89a',
  parchmentDark: '#a89878',
  inkDark:   '#1a1815',
  inkMedium: '#2e2a24',
  gold:      '#c5a059',
  goldLight: '#e0c080',
  goldDark:  '#8e6d35',
  borderStone: '#4e483e',
  borderDim:   '#3a352d',
  textDim:   '#5d574e',
  textWhite: '#d9d0c1',
  fontHeader: "'Cinzel', 'Noto Serif JP', serif",
  fontBody:   "'Noto Serif JP', serif",
};

export default function WallPageClient({ challenges, daysMap, profileMap }: Props) {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalDoneAll = Object.values(daysMap).flat().filter(d => d.status === 'done').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: S.bgDark,
      backgroundImage: 'url(\'https://www.transparenttextures.com/patterns/dark-leather.png\')',
      color: S.textWhite,
      fontFamily: S.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 環境光 */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(ellipse at 20% 15%, rgba(197,160,89,.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(100,80,40,.15) 0%, transparent 55%)', pointerEvents: 'none', zIndex: 0 }}/>

      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: 'none',
          color: S.textDim, fontFamily: S.fontBody,
          fontSize: '13px', cursor: 'pointer',
          padding: '14px 16px 0', letterSpacing: '0.05em',
        }}
      >
        ◂ 修行履歴へ戻る
      </button>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px', margin: '0 auto', padding: '0 0 80px' }}>

        {/* ── タイトル石版 ── */}
        <div style={{
          margin: '20px 16px 0',
          background: 'linear-gradient(160deg, #3d3a33 0%, #2a2824 100%)',
          border: '3px double ' + S.goldDark,
          borderRadius: '2px',
          padding: '22px 20px 18px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,.6), inset 0 1px 0 rgba(197,160,89,.1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 石版の亀裂装飾 */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(73deg, transparent, transparent 40px, rgba(0,0,0,.04) 40px, rgba(0,0,0,.04) 41px)', pointerEvents: 'none' }}/>
          <div style={{ fontSize: '13px', letterSpacing: '0.35em', color: S.goldDark, marginBottom: '10px', opacity: 0.7, userSelect: 'none' }}>
            {HIEROGLYPHS.slice(0, 7).join(' ')}
          </div>
          <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: S.textDim, margin: '0 0 8px', fontFamily: S.fontHeader, textTransform: 'uppercase' }}>
            ── Kizamareshi Kiroku ──
          </p>
          <h1 style={{
            fontSize: '22px', letterSpacing: '0.2em', margin: '0 0 8px',
            fontFamily: S.fontHeader, color: S.gold,
            textShadow: '0 0 18px rgba(197,160,89,.35), 2px 2px 4px rgba(0,0,0,.8)',
            textTransform: 'uppercase',
          }}>
            修行者たちの記録
          </h1>
          <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, ' + S.goldDark + ', transparent)', margin: '0 auto 10px' }}/>
          <p style={{ fontSize: '12px', color: S.textDim, margin: 0, fontFamily: S.fontBody, letterSpacing: '0.05em' }}>
            {challenges.length} 件の修行 ／ {totalDoneAll} 日を刻む
          </p>
        </div>

        {/* ── 石板グリッド ── */}
        <div style={{ margin: '20px 16px 0' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.25em', color: S.textDim, marginBottom: '12px', textAlign: 'center', fontFamily: S.fontHeader }}>
            ── 石板を選びて詳細を見よ ──
          </p>

          {/* 検索 */}
          <div style={{ marginBottom: '14px', position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="石板を探す… （名前・目標・テーマ）"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: S.inkMedium,
                border: '1px solid ' + S.borderStone,
                borderRadius: '2px',
                padding: '10px 14px 10px 36px',
                color: S.textWhite,
                fontFamily: S.fontBody,
                fontSize: '12px',
                letterSpacing: '0.05em',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: S.textDim, pointerEvents: 'none' }}>𓂀</span>
          </div>

          {/* カードグリッド */}
          {(() => {
            const q = searchQuery.trim().toLowerCase();
            const filtered = q ? challenges.filter(c => {
              const profile = profileMap[c.owner_user_id];
              const nick = (profile?.nickname || '匿名').toLowerCase();
              return nick.includes(q) || (c.goal ?? '').toLowerCase().includes(q) || (c.theme ?? '').toLowerCase().includes(q);
            }) : challenges;

            if (filtered.length === 0) return (
              <p style={{ textAlign: 'center', color: S.textDim, fontFamily: S.fontBody, fontSize: '13px', padding: '20px 0' }}>
                {q ? '石板が見つからぬ…' : 'まだ完了した修行がありません'}
              </p>
            );

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {filtered.map((c) => {
                  const days = daysMap[c.id] ?? [];
                  const doneDays = days.filter(d => d.status === 'done').length;
                  const profile = profileMap[c.owner_user_id];
                  const nickname = profile?.nickname || '匿名';
                  const themeData = c.theme ? THEMES[c.theme] : null;
                  const isPerfect = doneDays === 7;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChallenge(c)}
                      style={{
                        background: isPerfect
                          ? 'linear-gradient(160deg, ' + S.parchment + ' 0%, #b8a888 100%)'
                          : 'linear-gradient(160deg, #b5a68e 0%, #a09070 100%)',
                        backgroundImage: 'url(\'https://www.transparenttextures.com/patterns/old-mathematics.png\'), ' + (isPerfect ? 'linear-gradient(160deg, ' + S.parchment + ' 0%, #b8a888 100%)' : 'linear-gradient(160deg, #b5a68e 0%, #a09070 100%)'),
                        border: isPerfect ? '3px double ' + S.goldDark : '2px solid #8a7858',
                        borderRadius: '2px',
                        padding: '14px 12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: isPerfect
                          ? '0 6px 20px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,240,180,.4)'
                          : '0 4px 14px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* 羊皮紙の端焼け */}
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 100% 100%, rgba(80,50,10,.25) 0%, transparent 60%), radial-gradient(ellipse at 0% 0%, rgba(60,40,10,.15) 0%, transparent 50%)', pointerEvents: 'none' }}/>

                      {/* テーマ */}
                      <div style={{ fontSize: '10px', color: themeData?.color ?? S.textDim, fontFamily: S.fontHeader, marginBottom: '5px', letterSpacing: '0.08em', position: 'relative' }}>
                        {themeData ? themeData.label : (c.theme ?? '')}
                      </div>

                      {/* 目標 */}
                      <div style={{ fontSize: '11px', color: S.inkDark, fontFamily: S.fontBody, lineHeight: 1.55, marginBottom: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, position: 'relative' }}>
                        {c.goal ?? '（目標なし）'}
                      </div>

                      {/* 達成タイルグリッド */}
                      <div style={{ display: 'flex', gap: '3px', marginBottom: '8px', position: 'relative' }}>
                        {Array.from({ length: 7 }).map((_, i) => {
                          const day = days.find(d => d.day_number === i + 1);
                          const isDone = day?.status === 'done';
                          return (
                            <div key={i} style={{
                              width: '100%', aspectRatio: '1',
                              background: isDone
                                ? 'radial-gradient(circle at 40% 35%, #d4a843 0%, #8a5c18 55%, #4a2e08 100%)'
                                : 'linear-gradient(135deg, #6a5e4e 0%, #5a5040 100%)',
                              border: isDone ? '1px solid #c9a84c' : '1px solid #4a4035',
                              borderRadius: '1px',
                              boxShadow: isDone
                                ? 'inset 0 1px 0 rgba(255,220,120,.4), 0 2px 6px rgba(180,130,30,.3)'
                                : 'inset 0 1px 2px rgba(0,0,0,.5)',
                              position: 'relative',
                              overflow: 'hidden',
                            }}>
                              {isDone && (
                                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.06) 2px, rgba(255,255,255,.06) 3px)' }}/>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* フッター */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                        <span style={{ fontSize: '10px', color: S.inkMedium, fontFamily: S.fontBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '68%' }}>{nickname}</span>
                        <span style={{ fontSize: '11px', color: isPerfect ? S.goldDark : S.inkMedium, fontFamily: S.fontHeader, flexShrink: 0 }}>{doneDays}/7</span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#7a6848', fontFamily: S.fontBody, marginTop: '3px', position: 'relative' }}>
                        {(new Date(c.started_at).getMonth() + 1) + '/' + new Date(c.started_at).getDate()}〜
                      </div>

                      {/* 完全達成バッジ */}
                      {isPerfect && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', color: S.goldDark, fontFamily: S.fontHeader, letterSpacing: '0.05em' }}>✦</div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ── 共有ボタン ── */}
        <div style={{ margin: '28px 16px 0' }}>
          <button
            onClick={handleCopy}
            style={{
              width: '100%', padding: '14px',
              background: copied
                ? 'linear-gradient(160deg, #3a4a38, #2e3d2c)'
                : 'linear-gradient(160deg, ' + S.bgMedium + ', ' + S.bgDark + ')',
              border: copied ? '2px solid #6a9060' : '2px solid ' + S.borderStone,
              borderRadius: '2px',
              color: copied ? '#90c888' : S.textWhite,
              fontFamily: S.fontHeader,
              fontSize: '13px', letterSpacing: '0.12em',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ fontSize: '14px', color: copied ? '#90c888' : S.gold }}>
              {copied ? '✓' : '◎'}
            </span>
            {copied ? '壁画の断片をコピーした' : '壁画の破片を共有する'}
            <span style={{ fontSize: '10px', color: S.textDim, fontFamily: S.fontBody, textTransform: 'none' }}>
              {copied ? 'URL copied!' : '（URLをコピー）'}
            </span>
          </button>
        </div>

        {/* フッター */}
        <div style={{ textAlign: 'center', padding: '32px 20px 0', letterSpacing: '0.35em', fontSize: '14px', color: S.goldDark, opacity: 0.35, userSelect: 'none' }}>
          {HIEROGLYPHS.slice(3).join(' ')}
        </div>
        <p style={{ textAlign: 'center', fontSize: '10px', color: S.textDim, fontFamily: S.fontHeader, letterSpacing: '0.15em', marginTop: '12px', textTransform: 'uppercase' }}>
          Hagrit — 7日間の修行記録
        </p>
      </div>

      {/* ── 石板詳細モーダル ── */}
      {selectedChallenge && (() => {
        const days = daysMap[selectedChallenge.id] ?? [];
        const doneDays = days.filter(d => d.status === 'done').length;
        const profile = profileMap[selectedChallenge.owner_user_id];
        const nickname = profile?.nickname || '匿名';
        const monkeyComment = MONKEY_COMMENT(doneDays);
        const startDate = new Date(selectedChallenge.started_at);
        const formatDateFull = (d: Date) => d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
        const themeData = selectedChallenge.theme ? THEMES[selectedChallenge.theme] : null;
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
            onClick={() => { setSelectedChallenge(null); setSelectedDay(null); }}
          >
            <div
              style={{
                background: 'linear-gradient(160deg, ' + S.parchment + ' 0%, #a89878 100%)',
                backgroundImage: 'url(\'https://www.transparenttextures.com/patterns/old-mathematics.png\'), linear-gradient(160deg, ' + S.parchment + ' 0%, #a89878 100%)',
                border: '3px double ' + S.goldDark,
                borderRadius: '2px',
                padding: '26px 22px',
                width: '100%', maxWidth: '420px',
                position: 'relative', marginTop: '10px',
                boxShadow: '0 16px 48px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,240,180,.3)',
                color: S.inkDark,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* 端焼け */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 100% 100%, rgba(60,30,5,.3) 0%, transparent 55%), radial-gradient(ellipse at 0% 0%, rgba(40,20,5,.2) 0%, transparent 45%)', pointerEvents: 'none', borderRadius: '2px' }}/>

              <button onClick={() => { setSelectedChallenge(null); setSelectedDay(null); }} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: S.textDim, fontSize: '18px', cursor: 'pointer', padding: '4px 8px', zIndex: 1 }}>✕</button>

              {/* ヘッダー */}
              <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: S.goldDark, margin: '0 0 8px', fontFamily: S.fontHeader, textTransform: 'uppercase', position: 'relative' }}>── 石板の詳細 ──</p>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', letterSpacing: '0.12em', fontFamily: S.fontHeader, color: S.inkDark, position: 'relative' }}>
                {themeData ? themeData.label : selectedChallenge.theme}
              </h2>
              {selectedChallenge.goal && (
                <p style={{ fontSize: '13px', color: '#3a3020', fontFamily: S.fontBody, margin: '0 0 10px', lineHeight: 1.7, position: 'relative' }}>「{selectedChallenge.goal}」</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: S.textDim, fontFamily: S.fontBody, marginBottom: '18px', position: 'relative' }}>
                <span>{nickname}</span>
                <span>{formatDateFull(startDate)}〜</span>
              </div>

              {/* 7日グリッド */}
              <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: S.goldDark, marginBottom: '10px', fontFamily: S.fontHeader, textTransform: 'uppercase', position: 'relative' }}>── 刻まれし七日間 ──</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '14px', position: 'relative' }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = days.find(d => d.day_number === i + 1);
                  const isDone = day?.status === 'done';
                  return (
                    <button
                      key={i}
                      onClick={() => day && setSelectedDay(day)}
                      style={{
                        aspectRatio: '1', minWidth: 0,
                        background: isDone
                          ? 'radial-gradient(circle at 40% 35%, #d4a843 0%, #8a5c18 55%, #4a2e08 100%)'
                          : 'linear-gradient(135deg, #6a5e4e, #5a5040)',
                        border: isDone ? '1px solid #c9a84c' : '1px solid #4a4035',
                        borderRadius: '2px',
                        cursor: day ? 'pointer' : 'default',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                        padding: '4px 2px',
                        boxShadow: isDone ? 'inset 0 1px 0 rgba(255,220,120,.4), 0 2px 6px rgba(180,130,30,.25)' : 'inset 0 1px 2px rgba(0,0,0,.5)',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {isDone && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.06) 2px, rgba(255,255,255,.06) 3px)' }}/>}
                      <span style={{ fontSize: '10px', color: isDone ? S.goldLight : '#8a7868', fontFamily: S.fontHeader, letterSpacing: 0, position: 'relative' }}>{isDone ? '✦' : '·'}</span>
                      <span style={{ fontSize: '8px', color: isDone ? S.goldLight : '#6a5e4e', fontFamily: S.fontBody, position: 'relative' }}>D{i + 1}</span>
                    </button>
                  );
                })}
              </div>

              {/* 凡例 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '14px', position: 'relative' }}>
                <span style={{ fontSize: '10px', color: S.goldDark, fontFamily: S.fontBody }}>✦ 成し遂げた日</span>
                <span style={{ fontSize: '10px', color: S.textDim, fontFamily: S.fontBody }}>· 眠りし日</span>
              </div>

              {/* 達成数 */}
              <div style={{ textAlign: 'center', marginBottom: '18px', position: 'relative' }}>
                <span style={{ fontFamily: S.fontHeader, fontSize: '32px', color: doneDays === 7 ? S.goldDark : S.inkMedium, textShadow: doneDays === 7 ? '0 0 12px rgba(197,160,89,.3)' : 'none' }}>{doneDays}</span>
                <span style={{ fontSize: '14px', color: S.textDim, fontFamily: S.fontBody }}> / 7日</span>
              </div>

              {/* リアプレイ猿のコメント */}
              <div style={{
                background: 'rgba(26,24,21,.08)',
                border: '1px solid ' + S.goldDark,
                borderRadius: '2px',
                padding: '14px 16px',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                position: 'relative',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.1)',
              }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <img
                    src="https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/monkey-wizard.png"
                    alt="リアプレイ猿"
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', border: '1px solid ' + S.goldDark, objectFit: 'cover' }}
                  />
                  <p style={{ margin: 0, fontFamily: S.fontHeader, fontSize: '10px', color: S.goldDark, letterSpacing: '0.05em', textAlign: 'center' }}>— リアプレイ猿より —</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontFamily: S.fontBody, color: S.inkDark, lineHeight: 1.9, whiteSpace: 'pre-line' }}>{monkeyComment}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Day詳細モーダル ── */}
      {selectedDay && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, ' + S.parchment + ' 0%, #a89878 100%)',
              backgroundImage: 'url(\'https://www.transparenttextures.com/patterns/old-mathematics.png\'), linear-gradient(160deg, ' + S.parchment + ' 0%, #a89878 100%)',
              border: '3px double ' + S.goldDark,
              borderRadius: '2px',
              padding: '26px 22px',
              width: '100%', maxWidth: '380px',
              position: 'relative',
              boxShadow: '0 16px 48px rgba(0,0,0,.7)',
              color: S.inkDark,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 100% 100%, rgba(60,30,5,.3) 0%, transparent 55%)', pointerEvents: 'none', borderRadius: '2px' }}/>
            <button onClick={() => setSelectedDay(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: S.textDim, fontSize: '18px', cursor: 'pointer', padding: '4px 8px', zIndex: 1 }}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', position: 'relative' }}>
              <div style={{
                width: '44px', height: '44px', flexShrink: 0,
                background: selectedDay.status === 'done'
                  ? 'radial-gradient(circle at 40% 35%, #d4a843 0%, #8a5c18 55%, #4a2e08 100%)'
                  : 'linear-gradient(135deg, #6a5e4e, #5a5040)',
                border: selectedDay.status === 'done' ? '2px solid #c9a84c' : '2px solid #4a4035',
                borderRadius: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: selectedDay.status === 'done' ? '0 2px 8px rgba(180,130,30,.4)' : 'none',
              }}>
                <span style={{ fontFamily: S.fontHeader, fontSize: '16px', color: selectedDay.status === 'done' ? S.goldLight : '#8a7868' }}>
                  {selectedDay.status === 'done' ? '✦' : '·'}
                </span>
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '18px', letterSpacing: '0.12em', fontFamily: S.fontHeader, color: S.inkDark }}>Day {selectedDay.day_number}</p>
                <p style={{ margin: 0, fontSize: '11px', color: selectedDay.status === 'done' ? S.goldDark : S.textDim, fontFamily: S.fontBody }}>
                  {selectedDay.status === 'done' ? '成し遂げた' : '眠りし日'}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(142,109,53,.3)', paddingTop: '14px', position: 'relative' }}>
              {selectedDay.plan && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 5px', fontSize: '10px', letterSpacing: '0.2em', color: S.goldDark, fontFamily: S.fontHeader, textTransform: 'uppercase' }}>この日の修行内容</p>
                  <p style={{ margin: 0, fontSize: '13px', fontFamily: S.fontBody, color: S.inkDark, lineHeight: 1.8 }}>{selectedDay.plan}</p>
                </div>
              )}
              {selectedDay.next_step && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 5px', fontSize: '10px', letterSpacing: '0.2em', color: S.goldDark, fontFamily: S.fontHeader, textTransform: 'uppercase' }}>次への一歩</p>
                  <p style={{ margin: 0, fontSize: '13px', fontFamily: S.fontBody, color: '#4a3820', lineHeight: 1.8 }}>{selectedDay.next_step}</p>
                </div>
              )}
              {selectedDay.image_url && (
                <div style={{ marginTop: '12px' }}>
                  <img src={selectedDay.image_url} alt={'Day ' + selectedDay.day_number} style={{ width: '100%', borderRadius: '2px', border: '1px solid ' + S.goldDark, boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}/>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
