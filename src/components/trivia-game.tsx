"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TriviaQuestion } from "@/lib/content";

type LeaderRow = {
  rank: number;
  player_name: string;
  correct: number;
  total: number;
  time_ms: number;
};

function fmt(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function TriviaGame({ questions }: { questions: TriviaQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeMs, setTimeMs] = useState(0);

  // leaderboard / name submission state
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [board, setBoard] = useState<LeaderRow[] | null>(null);
  const [myName, setMyName] = useState("");

  const startedRef = useRef(0);
  useEffect(() => {
    startedRef.current = Date.now();
  }, []);

  const total = questions.length;
  const q = questions[index];
  const answered = selected !== null;

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === q.correct_index) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= total) {
      setTimeMs(Date.now() - startedRef.current);
      setFinished(true);
    } else {
      setIndex((n) => n + 1);
      setSelected(null);
    }
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setTimeMs(0);
    setName("");
    setSubmitting(false);
    setSubmitted(false);
    setError("");
    setBoard(null);
    setMyName("");
    startedRef.current = Date.now();
  }

  async function loadBoard() {
    try {
      const res = await fetch("/api/trivia/leaderboard");
      const d = await res.json();
      setBoard(d.leaderboard ?? []);
    } catch {
      setBoard([]);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/trivia/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: trimmed,
          correct: score,
          total,
          time_ms: timeMs,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? "Could not submit your score.");
        setSubmitting(false);
        return;
      }
      setMyName(trimmed);
      setSubmitted(true);
      await loadBoard();
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  // ── Results + leaderboard ────────────────────────────────────────
  if (finished) {
    const verdict =
      score === total
        ? "Real Filipino Foodie! Perfect score."
        : score >= total * 0.7
          ? "Ang galing — you really know your Filipino food!"
          : score >= total * 0.4
            ? "Not bad! A few more kainan and you will master it."
            : "Time to taste the real thing and learn as you eat!";

    return (
      <div className="mx-auto max-w-xl">
        <div className="ink-card rounded-3xl bg-brand/10 p-8 text-center">
          <p className="font-display text-lg font-bold text-brand-dark">
            Your score
          </p>
          <p className="font-display text-6xl font-extrabold text-accent-dark">
            {score}/{total}
          </p>
          <p className="mt-1 font-semibold text-ink/70">
            Time: {fmt(timeMs)}
          </p>
          <p className="mt-3 text-lg font-semibold text-maroon">{verdict}</p>

          {!submitted && (
            <form onSubmit={submit} className="mt-6">
              <label className="block font-display text-sm font-bold text-maroon">
                Add your name to the leaderboard
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="Your name"
                  className="w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-3 text-ink outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 rounded-full bg-brand px-6 py-3 font-display font-extrabold text-cream shadow-lg disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Submit"}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm font-semibold text-fiesta-red">{error}</p>
              )}
            </form>
          )}

          {submitted && (
            <p className="mt-5 font-semibold text-brand-dark">
              Saved! You&apos;re on the board below. 🎉
            </p>
          )}
        </div>

        {/* Leaderboard */}
        {board !== null && (
          <div className="ink-card mt-6 rounded-3xl bg-cream-deep/70 p-5">
            <h3 className="font-display text-xl font-extrabold text-maroon">
              Leaderboard
            </h3>
            <p className="text-xs font-semibold text-ink/55">
              Most correct, then fastest
            </p>
            <ol className="mt-3 space-y-1.5">
              {board.length === 0 && (
                <li className="rounded-xl bg-white/60 px-3 py-2 text-ink/60">
                  No scores yet — be the first!
                </li>
              )}
              {board.map((e, i) => {
                const mine = e.player_name === myName;
                return (
                  <li
                    key={`${e.rank}-${i}`}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                      mine ? "bg-accent/20 font-extrabold" : "bg-white/60"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 text-center font-display font-extrabold text-accent-dark">
                        {e.rank}
                      </span>
                      <span className="truncate">{e.player_name}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink/80">
                      {e.correct}/{e.total} · {fmt(e.time_ms)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/book"
            className="rounded-full bg-accent px-7 py-3.5 font-display text-lg font-extrabold text-cream shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Book your spot
          </Link>
          {board === null && (
            <button
              onClick={loadBoard}
              className="rounded-full border-[3px] border-brand px-7 py-3 font-display text-lg font-extrabold text-brand"
            >
              View leaderboard
            </button>
          )}
          <button
            onClick={restart}
            className="rounded-full border-[3px] border-brand px-7 py-3 font-display text-lg font-extrabold text-brand"
          >
            Play again
          </button>
        </div>
      </div>
    );
  }

  // ── Question play ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between font-display font-bold text-ink/60">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="ink-card rounded-3xl bg-cream-deep/70 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-extrabold text-maroon">
          {q.question}
        </h2>
        <div className="mt-5 grid gap-3">
          {q.choices.map((choice, i) => {
            const isCorrect = i === q.correct_index;
            const isPicked = i === selected;
            let cls = "border-ink/15 bg-white hover:border-brand hover:bg-brand/5";
            if (answered) {
              if (isCorrect) cls = "border-fiesta-green bg-fiesta-green/15";
              else if (isPicked) cls = "border-fiesta-red bg-fiesta-red/15";
              else cls = "border-ink/10 bg-white opacity-70";
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-semibold text-ink transition-colors ${cls}`}
              >
                <span>{choice}</span>
                {answered && isCorrect && <span>✓</span>}
                {answered && isPicked && !isCorrect && <span>✕</span>}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-5 rounded-xl bg-accent/10 px-4 py-3 text-ink/80">
            <span className="font-display font-bold text-accent-dark">
              Did you know?{" "}
            </span>
            {q.fun_fact}
          </div>
        )}

        {answered && (
          <button
            onClick={next}
            className="mt-6 w-full rounded-full bg-brand px-7 py-3.5 font-display text-lg font-extrabold text-cream shadow-lg transition-transform hover:-translate-y-0.5"
          >
            {index + 1 >= total ? "See my score" : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}
