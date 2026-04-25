import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import {
  WORDS,
  type WordStat,
  type Category,
  updateStat,
  recallProbability,
  masteryScore,
} from "./hoplingo-data";
import { getCurrentUser, subscribeUser } from "./hoplingo-user";

const STORAGE_PREFIX = "hoplingo-state-v1";
const storageKey = (user: string | null) =>
  user ? `${STORAGE_PREFIX}::${user}` : STORAGE_PREFIX;

export interface SessionLog {
  ts: number;
  wordId: string;
  correct: boolean;
  mode: "mc" | "type" | "es-en" | "en-es";
  ms: number;
}

export interface AppState {
  stats: Record<string, WordStat>;
  sessions: SessionLog[];
  xp: number;
  streak: number;
  lastDay: string; // YYYY-MM-DD
  achievements: string[];
  dailyGoal: number;
  todayXP: number;
  todayDay: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const initialState = (): AppState => ({
  stats: {},
  sessions: [],
  xp: 0,
  streak: 0,
  lastDay: "",
  achievements: [],
  dailyGoal: 50,
  todayXP: 0,
  todayDay: today(),
});

let state: AppState = initialState();
let initialized = false;
const listeners = new Set<() => void>();

function load() {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...initialState(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  // reset todayXP if new day
  const t = today();
  if (state.todayDay !== t) {
    state = { ...state, todayDay: t, todayXP: 0 };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

const ACHIEVEMENT_DEFS = [
  { id: "first-hop", label: "First Hop", desc: "Answer your first word", emoji: "🐰", check: (s: AppState) => s.sessions.length >= 1 },
  { id: "ten-correct", label: "Quick Learner", desc: "Get 10 correct", emoji: "⚡", check: (s: AppState) => s.sessions.filter((x) => x.correct).length >= 10 },
  { id: "fifty-correct", label: "Half Century", desc: "Get 50 correct", emoji: "🎯", check: (s: AppState) => s.sessions.filter((x) => x.correct).length >= 50 },
  { id: "streak-3", label: "On a Roll", desc: "3-day streak", emoji: "🔥", check: (s: AppState) => s.streak >= 3 },
  { id: "streak-7", label: "Week Warrior", desc: "7-day streak", emoji: "🏆", check: (s: AppState) => s.streak >= 7 },
  { id: "xp-500", label: "Rising Star", desc: "Reach 500 XP", emoji: "🌟", check: (s: AppState) => s.xp >= 500 },
  { id: "xp-2000", label: "Maestro", desc: "Reach 2000 XP", emoji: "👑", check: (s: AppState) => s.xp >= 2000 },
  { id: "category-master", label: "Category Master", desc: "Master a full category", emoji: "💎", check: (s: AppState) => {
    const byCat: Record<string, { seen: number; mast: number }> = {};
    WORDS.forEach((w) => {
      const m = masteryScore(s.stats[w.id]);
      byCat[w.category] = byCat[w.category] ?? { seen: 0, mast: 0 };
      byCat[w.category].seen += 1;
      if (m >= 80) byCat[w.category].mast += 1;
    });
    return Object.values(byCat).some((c) => c.seen > 0 && c.mast === c.seen);
  } },
];

export const ACHIEVEMENTS = ACHIEVEMENT_DEFS;

export function recordAnswer(wordId: string, correct: boolean, mode: SessionLog["mode"], ms: number) {
  setState((s) => {
    const next = { ...s };
    next.stats = { ...s.stats, [wordId]: updateStat(s.stats[wordId], correct, wordId) };
    next.sessions = [...s.sessions, { ts: Date.now(), wordId, correct, mode, ms }].slice(-1000);

    const gain = correct ? 10 : 2;
    next.xp = s.xp + gain;

    const t = today();
    if (next.todayDay !== t) {
      next.todayDay = t;
      next.todayXP = 0;
    }
    next.todayXP = (next.todayDay === s.todayDay ? s.todayXP : 0) + gain;

    // streak
    if (s.lastDay !== t) {
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      next.streak = s.lastDay === yesterday ? s.streak + 1 : 1;
      next.lastDay = t;
    }

    // achievements
    const newly = ACHIEVEMENT_DEFS.filter((a) => !s.achievements.includes(a.id) && a.check(next)).map((a) => a.id);
    if (newly.length) next.achievements = [...s.achievements, ...newly];

    return next;
  });
}

export function resetProgress() {
  setState(() => initialState());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return state;
}

export function useAppState(): AppState {
  load();
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ----- Selectors -----

export function useDueWords(categories?: Category[], limit = 10) {
  const s = useAppState();
  const pool = WORDS.filter((w) => !categories || categories.length === 0 || categories.includes(w.category));
  // due-ness = 1 - recall probability; new words start at 1
  const scored = pool.map((w) => {
    const stat = s.stats[w.id];
    const p = recallProbability(stat);
    const due = stat ? 1 - p : 0.95;
    return { word: w, due };
  });
  scored.sort((a, b) => b.due - a.due);
  return scored.slice(0, limit).map((x) => x.word);
}

import { LEVELS } from "./hoplingo-data";

// A level is unlocked when the previous level's average mastery >= threshold.
const UNLOCK_THRESHOLD = 70;

export function getLevelProgress(s: AppState, levelId: number) {
  const lvl = LEVELS.find((l) => l.id === levelId);
  if (!lvl) return { avg: 0, perCategory: [] as { category: Category; avg: number; mastered: number; total: number }[] };
  const perCategory = lvl.categories.map((c) => {
    const wordsIn = WORDS.filter((w) => w.category === c);
    const total = wordsIn.length;
    let sum = 0;
    let mastered = 0;
    wordsIn.forEach((w) => {
      const m = masteryScore(s.stats[w.id]);
      sum += m;
      if (m >= UNLOCK_THRESHOLD) mastered += 1;
    });
    return { category: c, avg: total ? Math.round(sum / total) : 0, mastered, total };
  });
  const avg = perCategory.reduce((a, c) => a + c.avg, 0) / Math.max(perCategory.length, 1);
  return { avg: Math.round(avg), perCategory };
}

export function isLevelUnlocked(s: AppState, levelId: number): boolean {
  if (levelId <= 1) return true;
  const prev = getLevelProgress(s, levelId - 1);
  return prev.avg >= UNLOCK_THRESHOLD;
}

export function isCategoryUnlocked(s: AppState, levelId: number, category: Category): boolean {
  if (!isLevelUnlocked(s, levelId)) return false;
  const lvl = LEVELS.find((l) => l.id === levelId);
  if (!lvl) return false;
  const idx = lvl.categories.indexOf(category);
  if (idx <= 0) return true;
  // Sequential: unlock category once previous category in same level is mastered
  const prevCat = lvl.categories[idx - 1];
  const wordsIn = WORDS.filter((w) => w.category === prevCat);
  if (wordsIn.length === 0) return true;
  const avg = wordsIn.reduce((a, w) => a + masteryScore(s.stats[w.id]), 0) / wordsIn.length;
  return avg >= UNLOCK_THRESHOLD;
}

export const LEVEL_UNLOCK_THRESHOLD = UNLOCK_THRESHOLD;

export function getCategoryMastery(s: AppState) {
  const byCat: Record<Category, { total: number; learned: number; avg: number }> = {} as never;
  WORDS.forEach((w) => {
    const m = masteryScore(s.stats[w.id]);
    if (!byCat[w.category]) byCat[w.category] = { total: 0, learned: 0, avg: 0 };
    byCat[w.category].total += 1;
    byCat[w.category].avg += m;
    if (m >= 70) byCat[w.category].learned += 1;
  });
  Object.values(byCat).forEach((v) => (v.avg = Math.round(v.avg / Math.max(v.total, 1))));
  return byCat;
}

export function getOverallStats(s: AppState) {
  const wordsTouched = Object.keys(s.stats).length;
  const mastered = WORDS.filter((w) => masteryScore(s.stats[w.id]) >= 80).length;
  const totalAnswers = s.sessions.length;
  const correct = s.sessions.filter((x) => x.correct).length;
  const accuracy = totalAnswers ? Math.round((correct / totalAnswers) * 100) : 0;
  return { wordsTouched, mastered, totalAnswers, correct, accuracy, totalWords: WORDS.length };
}

export function getDailyXP(s: AppState, days = 14) {
  const arr: { day: string; xp: number; correct: number; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = d.toISOString().slice(0, 10);
    const todays = s.sessions.filter((x) => new Date(x.ts).toISOString().slice(0, 10) === key);
    const correct = todays.filter((t) => t.correct).length;
    arr.push({
      day: key.slice(5),
      xp: todays.reduce((a, t) => a + (t.correct ? 10 : 2), 0),
      correct,
      total: todays.length,
    });
  }
  return arr;
}

export function useAction() {
  // helper hook to ensure state loads
  load();
  const [, force] = useState(0);
  useEffect(() => {
    const u = subscribe(() => force((n) => n + 1));
    return () => { u(); };
  }, []);
  return useCallback((fn: () => void) => fn(), []);
}
