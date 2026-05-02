"use client";

import { useState } from "react";

export interface DayLog {
  day_number: number;
  plan: string | null;
  status: "done" | "not_done" | string;
  image_url: string | null;
}

export interface ChallengeResult {
  id: string;
  theme: string;
  goal: string | null;
  started_at: string;
  days: DayLog[];
}

function getMonkeyComment(doneDays: number): string {
  if (doneDays === 7) {
    return "7日やり切ったな。\n習慣の入口に片足突っ込んだぞ。\n次の7日も同じ感覚でいけば、\nお前の人生変わるわ。";
  } else if (doneDays >= 5) {
    return "週4日以上が習慣化の鍵！\n良い調子ですっ";
  } else if (doneDays >= 3) {
    return "もう少しだけ目標の負荷を\n下げても良いかもですね！";
  } else {
    return "ウキ…始めたことは偉い。\nでも次はもっと頑張れよ！";
  }
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface Props {
  challenge: ChallengeResult;
  onClose: () => void;
}

export default function ResultDetailModal({ challenge, onClose }: Props) {
  const doneDays = challenge.days.filter((d) => d.status === "done").length;
  const totalDays = challenge.days.length;
  const monkeyComment = getMonkeyComment(doneDays);

  const stampText = doneDays === 7 ? "完走" : `${doneDays}/${totalDays}`;
  const stampColor =
    doneDays === 7
      ? "#c084fc"
      : doneDays >= 5
      ? "#60a5fa"
      : doneDays >= 3
      ? "#fbbf24"
      : "#f87171";

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#0f0d1a",
          border: "1px solid rgba(196,160,255,0.25)",
          borderRadius: "20px",
          padding: "24px 20px 28px",
          fontFamily: "'Nunito', sans-serif",
          color: "#e8e0f8",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "16px",
            background: "none",
            border: "none",
            color: "#9b88c8",
            fontSize: "22px",
            cursor: "pointer",
            lineHeight: 1,
            padding: "4px 6px",
          }}
          aria-label="閉じる"
        >
          ×
        </button>

        <p style={{ fontSize: "11px", color: "#9b88c8", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 4px" }}>
          今週の修行
        </p>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", fontWeight: 600, color: "#d8c8ff", margin: "0 0 16px", lineHeight: 1.4, paddingRight: "24px" }}>
          {challenge.theme}
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "52px",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              color: stampColor,
              lineHeight: 1,
              letterSpacing: "-1px",
              textShadow: `0 0 20px ${stampColor}55`,
              border: `3px solid ${stampColor}`,
              borderRadius: "12px",
              padding: "4px 12px",
              transform: "rotate(-3deg)",
              minWidth: "100px",
              textAlign: "center",
            }}
          >
            {stampText}
          </div>
          <div>
            <span style={{ display: "block", fontSize: "22px", fontWeight: 700, color: "#e8e0f8" }}>
              {doneDays}日達成
            </span>
            <span style={{ fontSize: "11px", color: "#7c6ea8" }}>
              {formatDate(challenge.started_at)} スタート
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", backgroundColor: "rgba(196,160,255,0.07)", border: "1px solid rgba(196,160,255,0.15)", borderRadius: "14px", padding: "12px 14px", marginBottom: "20px" }}>
          <img src="https://hgdwzaqujzjrozcryprg.supabase.co/storage/v1/object/public/post-images/characters/monkey-wizard.png" alt="リアプレイ猿" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "12px", color: "#c8b8f0", lineHeight: 1.65, fontStyle: "italic" }}>
            {monkeyComment}
          </div>
        </div>

        <div style={{ height: "1px", background: "rgba(196,160,255,0.12)", margin: "0 0 18px" }} />

        <div style={{ display: "flex", gap: "5px", marginBottom: "14px", justifyContent: "center" }}>
          {Array.from({ length: 7 }, (_, i) => {
            const day = challenge.days.find((d) => d.day_number === i + 1);
            const isDone = day?.status === "done";
            return (
              <div
                key={i}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  backgroundColor: isDone ? "rgba(196,160,255,0.15)" : "rgba(255,255,255,0.04)",
                  border: isDone ? "1px solid rgba(196,160,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
                }}
              >
                {isDone ? "🔥" : "💤"}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Array.from({ length: 7 }, (_, i) => {
            const day = challenge.days.find((d) => d.day_number === i + 1);
            const isDone = day?.status === "done";
            const planText = day?.plan?.trim() || "";
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "7px 10px", borderRadius: "10px",
                  backgroundColor: isDone ? "rgba(196,160,255,0.06)" : "transparent",
                  opacity: isDone ? 1 : 0.5,
                }}
              >
                <span style={{ fontSize: "10px", color: isDone ? "#c084fc" : "#6b5ea8", fontWeight: 600, minWidth: "24px", flexShrink: 0 }}>
                  DAY{i + 1}
                </span>
                <span style={{ fontSize: "12px", color: isDone ? "#ddd0f8" : "#6b5ea8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isDone ? (planText || "（記録なし）") : "—"}
                </span>
                {isDone && day?.image_url && (
                  <img
                    src={day.image_url}
                    alt={`day${i + 1}`}
                    style={{ width: "22px", height: "22px", borderRadius: "4px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(196,160,255,0.2)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: "#4a3e6a", letterSpacing: "0.15em", fontFamily: "'Cinzel', serif" }}>
          HAGRIT — 7 DAYS CHALLENGE
        </div>
      </div>
    </div>
  );
}