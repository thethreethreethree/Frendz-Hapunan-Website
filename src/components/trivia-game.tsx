"use client";

import { useState } from "react";
import Link from "next/link";
import type { TriviaQuestion } from "@/lib/content";

export function TriviaGame({ questions }: { questions: TriviaQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

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
  }

  if (finished) {
    const verdict =
      score === total
        ? "Tunay na Pinoy foodie! Perfect score."
        : score >= total * 0.7
          ? "Ang galing — you really know your Filipino food!"
          : score >= total * 0.4
            ? "Not bad! A few more kainan and you will master it."
            : "Time to taste the real thing and learn as you eat!";
    return (
      <div className="ink-card mx-auto max-w-xl rounded-3xl bg-brand/10 p-8 text-center">
        <p className="font-display text-lg font-bold text-brand-dark">
          Your score
        </p>
        <p className="font-display text-6xl font-extrabold text-accent-dark">
          {score}/{total}
        </p>
        <p className="mt-3 text-lg font-semibold text-maroon">{verdict}</p>
        <p className="mt-4 text-ink/75">
          Hungry now? Come taste all of it for real at Frendz Hapunan.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/book"
            className="rounded-full bg-accent px-7 py-3.5 font-display text-lg font-extrabold text-cream shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Book your spot
          </Link>
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
            let cls =
              "border-ink/15 bg-white hover:border-brand hover:bg-brand/5";
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
