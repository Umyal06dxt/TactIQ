"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { Briefing, CoachingEvent } from "@/lib/types";
import { api } from "@/lib/api";
import { Confetti } from "@/components/Confetti";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://set-daring-tadpole.ngrok-free.app";
const WS_BASE = BASE.replace(/^https?/, (p) => (p === "https" ? "wss" : "ws"));

type CoachUpdate = {
  suggestions: string[];
  warnings: string[];
  correction: string | null;
  current_tactic: string | null;
  win_probability: number;
  concession_alert: string | null;
  deal_momentum: "positive" | "neutral" | "negative";
  coach_note: string | null;
  concession_count: number;
};

type TranscriptLine = { id: number; text: string };

const WAVE_DELAYS = [
  0, 0.12, 0.24, 0.06, 0.18, 0.3, 0.09, 0.21, 0.03, 0.15, 0.27, 0.08, 0.2, 0.32,
  0.04, 0.16, 0.28, 0.1, 0.22, 0.34,
];
const WAVE_DURATIONS = [
  0.5, 0.6, 0.45, 0.55, 0.65, 0.5, 0.7, 0.45, 0.6, 0.5, 0.65, 0.55, 0.45, 0.6,
  0.5, 0.7, 0.55, 0.65, 0.5, 0.6,
];

const DEMO_SCRIPT = [
  "Hi, thank you for joining today. We'd like to discuss our upcoming renewal.",
  "The proposed price is 22% higher than last year — that's significantly above our budget.",
  "We've evaluated some alternatives. Similar platforms offer comparable features at a lower price.",
  "What's the best you can do if we commit to a two-year renewal?",
  "I have to be transparent — our budget ceiling for this is $180,000 annually. We can't go above that.",
  "If the pricing can't move, I'll need to bring this to our CFO and seriously evaluate switching.",
  "Our legal team needs at least 60 days to finalize any agreement from today.",
];

type Phase =
  | "idle"
  | "connecting"
  | "loading"
  | "live"
  | "demo"
  | "ended"
  | "saving";

function WinProbMeter({ prob }: { prob: number }) {
  const color = prob >= 65 ? "#10b981" : prob >= 40 ? "#f59e0b" : "#ef4444";
  const label = prob >= 65 ? "Winning" : prob >= 40 ? "Uncertain" : "At risk";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = circ * (prob / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={r}
            strokeWidth="5"
            className="stroke-white/8 fill-none"
          />
          <circle
            cx="32"
            cy="32"
            r={r}
            strokeWidth="5"
            fill="none"
            stroke={color}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 0.6s ease, stroke 0.4s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>
            {prob}%
          </span>
        </div>
      </div>
      <p
        className="text-[9px] uppercase tracking-widest font-bold"
        style={{ color }}
      >
        {label}
      </p>
    </div>
  );
}

function MomentumBadge({
  momentum,
}: {
  momentum: "positive" | "neutral" | "negative";
}) {
  const styles = {
    positive: {
      cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      icon: "↑",
      label: "Positive",
    },
    neutral: {
      cls: "bg-white/8 border-white/15 text-white/40",
      icon: "→",
      label: "Neutral",
    },
    negative: {
      cls: "bg-red-500/15 border-red-500/30 text-red-400",
      icon: "↓",
      label: "Negative",
    },
  };
  const s = styles[momentum];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${s.cls}`}
    >
      {s.icon} {s.label}
    </span>
  );
}

export function CallClient({
  vendor,
  briefing,
}: {
  vendor: string;
  briefing: Briefing;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [coaching, setCoaching] = useState<CoachUpdate>({
    suggestions: [],
    warnings: [],
    correction: null,
    current_tactic: null,
    win_probability: 50,
    concession_alert: null,
    deal_momentum: "neutral",
    coach_note: null,
    concession_count: 0,
  });
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [duration, setDuration] = useState(0);
  const [correction, setCorrection] = useState<string | null>(null);
  const [concessionAlert, setConcessionAlert] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachingHistory, setCoachingHistory] = useState<CoachingEvent[]>([]);
  const [pendingOutcome, setPendingOutcome] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoIndexRef = useRef(0);
  const correctionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const concessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const lineIdRef = useRef(0);
  const startedAtRef = useRef<string>("");
  const turnRef = useRef(0);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const pushCorrection = useCallback((text: string) => {
    setCorrection(text);
    if (correctionTimerRef.current) clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = setTimeout(() => setCorrection(null), 7000);
  }, []);

  const pushConcessionAlert = useCallback((text: string) => {
    setConcessionAlert(text);
    if (concessionTimerRef.current) clearTimeout(concessionTimerRef.current);
    concessionTimerRef.current = setTimeout(
      () => setConcessionAlert(null),
      8000,
    );
  }, []);

  const sendToCoach = useCallback((text: string, ws: WebSocket) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    setCoachLoading(true);
    ws.send(JSON.stringify({ type: "transcript", text }));
  }, []);

  const startRecording = useCallback(
    (stream: MediaStream, ws: WebSocket) => {
      const mimeType =
        ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((t) =>
          MediaRecorder.isTypeSupported(t),
        ) ?? "";
      const ext = mimeType.includes("ogg") ? "ogg" : "webm";

      const segment = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          return;
        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : {},
        );
        recorderRef.current = recorder;
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
          if (blob.size < 1500) {
            segment();
            return;
          }
          try {
            const formData = new FormData();
            formData.append("audio", blob, `audio.${ext}`);
            const res = await fetch(`${BASE}/api/transcribe`, {
              method: "POST",
              body: formData,
            });
            const { text } = (await res.json()) as { text: string };
            const trimmed = text?.trim();
            const isFiller =
              !trimmed ||
              trimmed.length < 3 ||
              /^(thank you\.?|thanks\.?|you)$/i.test(trimmed);
            if (!isFiller) {
              const id = ++lineIdRef.current;
              setTranscript((prev) => [...prev, { id, text: trimmed }]);
              sendToCoach(trimmed, ws);
            }
          } catch {}
          segment();
        };
        recorder.start();
        setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, 3000);
      };
      segment();
    },
    [sendToCoach],
  );

  const startCall = useCallback(async () => {
    setPhase("connecting");
    setWsError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
    } catch {
      setWsError(
        "Microphone access denied. Allow mic in browser settings and try again.",
      );
      setPhase("idle");
      return;
    }
    const ws = new WebSocket(`${WS_BASE}/ws/call/${vendor}`);
    wsRef.current = ws;
    ws.onopen = () => setPhase("loading");
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === "status") {
          if (msg.message === "ready") {
            startedAtRef.current = new Date().toISOString();
            setPhase("live");
            timerRef.current = setInterval(
              () => setDuration((d) => d + 1),
              1000,
            );
            startRecording(stream, ws);
          }
          return;
        }
        setCoachLoading(false);
        if (msg.type === "coach") {
          setCoaching({
            suggestions: msg.suggestions ?? [],
            warnings: msg.warnings ?? [],
            correction: msg.correction ?? null,
            current_tactic: msg.current_tactic ?? null,
            win_probability: msg.win_probability ?? 50,
            concession_alert: msg.concession_alert ?? null,
            deal_momentum: msg.deal_momentum ?? "neutral",
            coach_note: msg.coach_note ?? null,
            concession_count: msg.concession_count ?? 0,
          });
          setCoachingHistory((prev) => [
            ...prev,
            {
              turn: turnRef.current++,
              suggestions: msg.suggestions ?? [],
              warnings: msg.warnings ?? [],
              correction: msg.correction ?? null,
              current_tactic: msg.current_tactic ?? null,
              win_probability: msg.win_probability,
              concession_alert: msg.concession_alert,
              deal_momentum: msg.deal_momentum,
              coach_note: msg.coach_note,
            },
          ]);
          if (msg.correction) pushCorrection(msg.correction);
          if (msg.concession_alert) pushConcessionAlert(msg.concession_alert);
        } else if (msg.type === "error") {
          setWsError(msg.message ?? "Coach error");
        }
      } catch {}
    };
    ws.onerror = () =>
      setWsError("Connection error — check that the backend is running.");
    ws.onclose = () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [vendor, startRecording, pushCorrection, pushConcessionAlert]);

  const startDemo = useCallback(async () => {
    setPhase("connecting");
    setWsError(null);
    demoIndexRef.current = 0;
    const ws = new WebSocket(`${WS_BASE}/ws/call/${vendor}`);
    wsRef.current = ws;
    ws.onopen = () => setPhase("loading");
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === "status" && msg.message === "ready") {
          startedAtRef.current = new Date().toISOString();
          setPhase("demo");
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
          demoTimerRef.current = setInterval(() => {
            const idx = demoIndexRef.current;
            if (idx >= DEMO_SCRIPT.length) {
              if (demoTimerRef.current) clearInterval(demoTimerRef.current);
              return;
            }
            const text = DEMO_SCRIPT[idx];
            demoIndexRef.current = idx + 1;
            const id = ++lineIdRef.current;
            setTranscript((prev) => [...prev, { id, text }]);
            if (ws.readyState === WebSocket.OPEN) {
              setCoachLoading(true);
              ws.send(JSON.stringify({ type: "transcript", text }));
            }
          }, 6000);
          return;
        }
        setCoachLoading(false);
        if (msg.type === "coach") {
          setCoaching({
            suggestions: msg.suggestions ?? [],
            warnings: msg.warnings ?? [],
            correction: msg.correction ?? null,
            current_tactic: msg.current_tactic ?? null,
            win_probability: msg.win_probability ?? 50,
            concession_alert: msg.concession_alert ?? null,
            deal_momentum: msg.deal_momentum ?? "neutral",
            coach_note: msg.coach_note ?? null,
            concession_count: msg.concession_count ?? 0,
          });
          setCoachingHistory((prev) => [
            ...prev,
            {
              turn: turnRef.current++,
              suggestions: msg.suggestions ?? [],
              warnings: msg.warnings ?? [],
              correction: msg.correction ?? null,
              current_tactic: msg.current_tactic ?? null,
              win_probability: msg.win_probability,
              concession_alert: msg.concession_alert,
              deal_momentum: msg.deal_momentum,
              coach_note: msg.coach_note,
            },
          ]);
          if (msg.correction) pushCorrection(msg.correction);
          if (msg.concession_alert) pushConcessionAlert(msg.concession_alert);
        } else if (msg.type === "error") {
          setWsError(msg.message ?? "Coach error");
        }
      } catch {}
    };
    ws.onerror = () =>
      setWsError("Connection error — check that the backend is running.");
    ws.onclose = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    };
  }, [vendor, pushCorrection, pushConcessionAlert]);

  const endCall = useCallback(async () => {
    recorderRef.current?.stop();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end" }));
      wsRef.current.close();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (pendingOutcome === "won") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    setPhase("saving");
    const endedAt = new Date().toISOString();
    try {
      const result = await api.calls.save({
        vendor,
        started_at: startedAtRef.current || endedAt,
        ended_at: endedAt,
        duration_secs: duration,
        transcript: transcript.map((l) => l.text),
        coaching_shown: coachingHistory,
        outcome: pendingOutcome,
        briefing_context: `${briefing.vendor} - ${briefing.contract.contact} - $${briefing.contract.value}/yr`,
        concessions_made: coaching.concession_count,
      });
      window.location.href = `/calls/${vendor}/${result.id}`;
    } catch {
      setPhase("ended");
    }
  }, [
    vendor,
    duration,
    transcript,
    coachingHistory,
    pendingOutcome,
    briefing,
    coaching.concession_count,
  ]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const livePhase = phase === "live" || phase === "demo";
      if ((e.key === "1" || e.key === "2" || e.key === "3") && livePhase) {
        const idx = parseInt(e.key) - 1;
        const s = coaching.suggestions[idx];
        if (s) {
          navigator.clipboard.writeText(s).catch(() => {});
          setCopiedIdx(idx);
          setTimeout(() => setCopiedIdx(null), 2000);
        }
      }
      if (e.key === "Escape") {
        setCorrection(null);
        setConcessionAlert(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, coaching.suggestions]);

  useEffect(
    () => () => {
      recorderRef.current?.stop();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      wsRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      if (correctionTimerRef.current) clearTimeout(correctionTimerRef.current);
      if (concessionTimerRef.current) clearTimeout(concessionTimerRef.current);
    },
    [],
  );

  const isLive = phase === "live" || phase === "demo";
  const topTactics = useMemo(
    () => briefing.tactics.filter((t) => !t.is_anti_pattern).slice(0, 3),
    [briefing],
  );
  const tacticsDeployed = useMemo(() => {
    const seen = new Set(
      coachingHistory.map((e) => e.current_tactic).filter(Boolean),
    );
    return seen.size;
  }, [coachingHistory]);

  return (
    <div className="h-screen bg-[#05080f] text-white flex flex-col overflow-hidden">
      <Confetti active={showConfetti} />

      {/* Correction toast */}
      {correction && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-amber-400 text-black rounded-2xl px-5 py-3 shadow-2xl shadow-amber-500/30 flex items-start gap-3 max-w-sm animate-[slideDown_0.25s_ease-out]">
            <span className="text-xl mt-0.5">⚠</span>
            <div className="flex-1">
              <div className="font-black text-xs uppercase tracking-widest mb-1">
                Correction
              </div>
              <div className="text-sm font-medium leading-snug">
                {correction}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Concession alert toast */}
      {concessionAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-red-500 text-white rounded-2xl px-5 py-3 shadow-2xl shadow-red-500/30 flex items-start gap-3 max-w-sm animate-[slideDown_0.25s_ease-out]">
            <span className="text-xl mt-0.5">🚨</span>
            <div className="flex-1">
              <div className="font-black text-xs uppercase tracking-widest mb-1">
                Concession Alert
              </div>
              <div className="text-sm font-medium leading-snug">
                {concessionAlert}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 border-b border-white/8 px-6 py-3 flex items-center justify-between gap-6 bg-black/20">
        <div className="flex items-center gap-4 min-w-0">
          <a
            href={`/briefing/${vendor}`}
            className="shrink-0 text-white/30 hover:text-white/60 transition text-sm"
          >
            ← Briefing
          </a>
          <div className="w-px h-4 bg-white/10 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-white tracking-wide">
              {vendor.toUpperCase()}
            </span>
            <span className="text-white/30 text-sm ml-2 truncate">
              with {briefing.contract.contact}
            </span>
          </div>
          {coaching.current_tactic && (
            <span className="shrink-0 bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs px-3 py-1 rounded-full font-medium">
              {coaching.current_tactic}
            </span>
          )}
          {isLive && <MomentumBadge momentum={coaching.deal_momentum} />}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {isLive && coaching.concession_count > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span>⚡</span>
              {coaching.concession_count} concession
              {coaching.concession_count !== 1 ? "s" : ""}
            </div>
          )}
          {wsError && (
            <span className="text-xs text-red-400 max-w-xs truncate">
              {wsError}
            </span>
          )}
          <div
            className={`flex items-center gap-2 font-mono text-sm ${isLive ? "text-red-400" : "text-white/20"}`}
          >
            {isLive && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            {fmt(duration)}
          </div>
          {phase !== "idle" && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wider ${
                phase === "live"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : phase === "demo"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : phase === "connecting" ||
                        phase === "loading" ||
                        phase === "saving"
                      ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                      : "bg-white/8 text-white/30 border border-white/10"
              }`}
            >
              {phase === "live"
                ? "LIVE"
                : phase === "demo"
                  ? "DEMO"
                  : phase === "connecting"
                    ? "CONNECTING"
                    : phase === "loading"
                      ? "LOADING"
                      : phase === "saving"
                        ? "SAVING"
                        : "ENDED"}
            </span>
          )}
        </div>
      </header>

      {/* Main 3-column body */}
      <div className="flex-1 grid grid-cols-[1fr_340px_1fr] min-h-0">
        {/* Left: Say This */}
        <div className="border-r border-white/8 flex flex-col bg-emerald-950/10">
          <div className="px-6 pt-5 pb-3 border-b border-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Say This
            </h2>
            {isLive && !coachLoading && coaching.suggestions.length > 0 && (
              <span className="ml-auto text-[9px] text-emerald-900 font-mono">
                1·2·3 to copy
              </span>
            )}
            {coachLoading && isLive && (
              <span className="ml-auto text-[10px] text-emerald-600 animate-pulse">
                thinking…
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {coaching.suggestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full border border-emerald-900 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3z"
                    />
                  </svg>
                </div>
                <p className="text-emerald-900 text-xs">
                  {isLive
                    ? "Speak to get suggestions…"
                    : "Suggestions appear here during the call"}
                </p>
                {!isLive && topTactics.length > 0 && (
                  <div className="mt-4 w-full space-y-2 text-left">
                    <p className="text-[10px] text-white/20 uppercase tracking-wider">
                      Top tactics to deploy:
                    </p>
                    {topTactics.map((t) => (
                      <div
                        key={t.name}
                        className="bg-emerald-950/40 border border-emerald-900/50 rounded-lg px-3 py-2"
                      >
                        <div className="text-xs font-semibold text-emerald-600">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-white/30 mt-0.5">
                          {t.timing}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {coaching.suggestions.map((s, i) => (
                  <div
                    key={`${s}-${i}`}
                    onClick={() => {
                      navigator.clipboard.writeText(s).catch(() => {});
                      setCopiedIdx(i);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    }}
                    className={`border rounded-xl p-4 transition-all cursor-pointer group ${
                      copiedIdx === i
                        ? "bg-emerald-600/30 border-emerald-500/60"
                        : "bg-emerald-950/50 border-emerald-800/40 hover:border-emerald-600/60 hover:bg-emerald-950/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                          {i === 0
                            ? "Recommended"
                            : i === 1
                              ? "Alternative"
                              : "Deflect"}
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-800 group-hover:text-emerald-600 transition-colors">
                        {copiedIdx === i ? "✓ copied" : `press ${i + 1}`}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-100 leading-relaxed">
                      &ldquo;{s}&rdquo;
                    </p>
                  </div>
                ))}
                {coaching.coach_note && (
                  <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-3 mt-2">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">
                      Coach insight
                    </p>
                    <p className="text-xs text-blue-300/70 leading-relaxed italic">
                      {coaching.coach_note}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Center: Call control + live metrics */}
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-6 bg-black/10 border-r border-white/8">
          {/* Contract badge */}
          <div className="w-full rounded-xl bg-white/4 border border-white/8 px-4 py-3 text-center">
            <div className="text-xs text-white/30 mb-1">
              ${briefing.contract.value.toLocaleString()}/yr
            </div>
            <div className="text-xs text-white/50">
              {briefing.contract.renewal_date}
            </div>
            <div className="text-xs text-red-400 font-semibold mt-1">
              {briefing.contract.days_remaining}d left
            </div>
          </div>

          {/* Win probability — shown when live */}
          {isLive && (
            <div className="w-full flex items-center justify-center gap-4 bg-white/3 rounded-xl border border-white/8 py-3">
              <WinProbMeter prob={coaching.win_probability} />
              <div className="text-left">
                <p className="text-[10px] text-white/30 uppercase tracking-wider">
                  Deal score
                </p>
                <p className="text-2xl font-black text-white">
                  {coaching.win_probability}
                </p>
                <p className="text-[10px] text-white/20">/ 100</p>
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
              </div>
              <button
                onClick={startCall}
                className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-emerald-500/25"
              >
                Start Live Call
              </button>
              <div className="flex items-center gap-2 text-white/20 text-xs">
                <div className="h-px w-10 bg-white/10" />
                <span>or</span>
                <div className="h-px w-10 bg-white/10" />
              </div>
              <button
                onClick={startDemo}
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Demo Simulation
              </button>
              <p className="text-xs text-white/20 max-w-[180px] leading-relaxed">
                Watch a scripted negotiation with real AI coaching — no mic
                needed
              </p>
            </div>
          )}

          {(phase === "connecting" || phase === "loading") && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
              <p className="text-white/40 text-sm">
                {phase === "loading"
                  ? "Loading briefing context…"
                  : "Connecting…"}
              </p>
            </div>
          )}

          {(phase === "live" || phase === "demo") && (
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Waveform */}
              <div className="flex items-end justify-center gap-[3px] h-12 w-full">
                {WAVE_DELAYS.map((delay, i) => (
                  <div
                    key={i}
                    className={`flex-1 max-w-[8px] rounded-t-full origin-bottom ${phase === "demo" ? "bg-blue-400" : "bg-emerald-400"}`}
                    style={{
                      height: "100%",
                      animation: `bar-wave ${WAVE_DURATIONS[i]}s ease-in-out ${delay}s infinite`,
                    }}
                  />
                ))}
              </div>

              <div className="text-center">
                {phase === "demo" ? (
                  <p className="text-blue-400/70 text-xs flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
                    Demo playing · {transcript.length}/{DEMO_SCRIPT.length}{" "}
                    turns · {tacticsDeployed} tactics
                  </p>
                ) : (
                  <p className="text-white/50 text-xs flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    Mic active · {transcript.length} turns · {tacticsDeployed}{" "}
                    tactics
                  </p>
                )}
              </div>

              {/* Outcome selector */}
              <div className="w-full space-y-1.5">
                <p className="text-[10px] text-white/20 uppercase tracking-wider text-center">
                  Expected outcome
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["won", "lost", "pending", "escalated"] as const).map(
                    (o) => (
                      <button
                        key={o}
                        onClick={() =>
                          setPendingOutcome(pendingOutcome === o ? null : o)
                        }
                        className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          pendingOutcome === o
                            ? o === "won"
                              ? "bg-emerald-500 text-black"
                              : o === "lost"
                                ? "bg-red-500 text-white"
                                : o === "pending"
                                  ? "bg-yellow-500 text-black"
                                  : "bg-orange-500 text-white"
                            : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
                        }`}
                      >
                        {o}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <button
                onClick={endCall}
                className="w-full bg-red-600/80 hover:bg-red-500 active:scale-95 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
              >
                End Call
              </button>
            </div>
          )}

          {phase === "saving" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
              <p className="text-white/40 text-sm">Analyzing call…</p>
              <div className="space-y-1 text-xs text-white/20 max-w-[200px]">
                <p>· Scoring adherence</p>
                <p>· Computing deal intelligence</p>
                <p>· Updating negotiation memory</p>
                <p>· Estimating savings</p>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/25">
                <span>{transcript.length} turns</span>
                <span>·</span>
                <span>{tacticsDeployed} tactics</span>
                <span>·</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>
          )}

          {phase === "ended" && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white/40 text-sm">Call ended</p>
                <p className="text-white/20 text-xs mt-1">
                  Duration: {fmt(duration)}
                </p>
              </div>
              <a
                href={`/briefing/${vendor}`}
                className="bg-white/8 hover:bg-white/15 text-white px-6 py-3 rounded-xl transition text-sm font-medium"
              >
                Log post-call notes →
              </a>
            </div>
          )}
        </div>

        {/* Right: Avoid + Coach context */}
        <div className="flex flex-col bg-red-950/10">
          <div className="px-6 pt-5 pb-3 border-b border-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-red-400">
              Avoid
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {coaching.warnings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full border border-red-950 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-950"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
                <p className="text-red-950/70 text-xs">
                  {isLive
                    ? "Monitoring for pitfalls…"
                    : "Warnings appear here during the call"}
                </p>
                {!isLive &&
                  briefing.tactics.filter((t) => t.is_anti_pattern).length >
                    0 && (
                    <div className="mt-4 w-full space-y-2 text-left">
                      <p className="text-[10px] text-white/20 uppercase tracking-wider">
                        Known anti-patterns:
                      </p>
                      {briefing.tactics
                        .filter((t) => t.is_anti_pattern)
                        .map((t) => (
                          <div
                            key={t.name}
                            className="bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2"
                          >
                            <div className="text-xs font-semibold text-red-600">
                              {t.name}
                            </div>
                            <div className="text-[11px] text-white/30 mt-0.5 line-clamp-2">
                              {t.evidence}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            ) : (
              <>
                {coaching.warnings.map((w, i) => (
                  <div
                    key={`${w}-${i}`}
                    className="bg-red-950/50 border border-red-800/40 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-400 text-sm">⚠</span>
                      <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">
                        Avoid
                      </span>
                    </div>
                    <p className="text-sm text-red-200 leading-relaxed">{w}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transcript strip */}
      <div className="shrink-0 border-t border-white/8 bg-black/30 h-32 flex flex-col">
        <div className="px-6 pt-3 pb-1 flex items-center gap-2">
          <div className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
            Live Transcript
          </div>
          {isLive && (
            <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-3 space-y-0.5">
          {transcript.length === 0 ? (
            <p className="text-white/15 text-xs italic">
              {isLive
                ? "Transcription appears here every ~4 seconds…"
                : "Your words will appear here"}
            </p>
          ) : (
            transcript.map((line) => (
              <p key={line.id} className="text-sm text-white/60 leading-snug">
                {line.text}
              </p>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
}
