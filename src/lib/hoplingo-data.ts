// Vocabulary + half-life regression simulation for HopLingo

export type Category =
  | "greetings"
  | "food"
  | "travel"
  | "family"
  | "numbers"
  | "verbs"
  | "colors"
  | "time";

export interface Word {
  id: string;
  es: string;
  en: string;
  category: Category;
  difficulty: 1 | 2 | 3;
}

export interface WordStat {
  id: string;
  seen: number;
  correct: number;
  lastSeen: number; // ms timestamp
  halfLife: number; // hours — grows with successful recall
}

export const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: "greetings", label: "Greetings", emoji: "👋" },
  { key: "food", label: "Food", emoji: "🍳" },
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { key: "numbers", label: "Numbers", emoji: "🔢" },
  { key: "verbs", label: "Verbs", emoji: "⚡" },
  { key: "colors", label: "Colors", emoji: "🎨" },
  { key: "time", label: "Time", emoji: "⏰" },
];

export const WORDS: Word[] = [
  // greetings
  { id: "g1", es: "hola", en: "hello", category: "greetings", difficulty: 1 },
  { id: "g2", es: "adiós", en: "goodbye", category: "greetings", difficulty: 1 },
  { id: "g3", es: "buenos días", en: "good morning", category: "greetings", difficulty: 2 },
  { id: "g4", es: "buenas noches", en: "good night", category: "greetings", difficulty: 2 },
  { id: "g5", es: "gracias", en: "thank you", category: "greetings", difficulty: 1 },
  { id: "g6", es: "por favor", en: "please", category: "greetings", difficulty: 1 },
  { id: "g7", es: "lo siento", en: "I'm sorry", category: "greetings", difficulty: 2 },
  // food
  { id: "f1", es: "manzana", en: "apple", category: "food", difficulty: 1 },
  { id: "f2", es: "pan", en: "bread", category: "food", difficulty: 1 },
  { id: "f3", es: "queso", en: "cheese", category: "food", difficulty: 2 },
  { id: "f4", es: "agua", en: "water", category: "food", difficulty: 1 },
  { id: "f5", es: "café", en: "coffee", category: "food", difficulty: 1 },
  { id: "f6", es: "huevo", en: "egg", category: "food", difficulty: 2 },
  { id: "f7", es: "pollo", en: "chicken", category: "food", difficulty: 2 },
  { id: "f8", es: "arroz", en: "rice", category: "food", difficulty: 2 },
  // travel
  { id: "t1", es: "aeropuerto", en: "airport", category: "travel", difficulty: 3 },
  { id: "t2", es: "tren", en: "train", category: "travel", difficulty: 1 },
  { id: "t3", es: "boleto", en: "ticket", category: "travel", difficulty: 2 },
  { id: "t4", es: "maleta", en: "suitcase", category: "travel", difficulty: 2 },
  { id: "t5", es: "hotel", en: "hotel", category: "travel", difficulty: 1 },
  { id: "t6", es: "playa", en: "beach", category: "travel", difficulty: 2 },
  // family
  { id: "fa1", es: "madre", en: "mother", category: "family", difficulty: 1 },
  { id: "fa2", es: "padre", en: "father", category: "family", difficulty: 1 },
  { id: "fa3", es: "hermano", en: "brother", category: "family", difficulty: 2 },
  { id: "fa4", es: "hermana", en: "sister", category: "family", difficulty: 2 },
  { id: "fa5", es: "hijo", en: "son", category: "family", difficulty: 2 },
  { id: "fa6", es: "abuela", en: "grandmother", category: "family", difficulty: 3 },
  // numbers
  { id: "n1", es: "uno", en: "one", category: "numbers", difficulty: 1 },
  { id: "n2", es: "dos", en: "two", category: "numbers", difficulty: 1 },
  { id: "n3", es: "tres", en: "three", category: "numbers", difficulty: 1 },
  { id: "n4", es: "diez", en: "ten", category: "numbers", difficulty: 1 },
  { id: "n5", es: "cien", en: "hundred", category: "numbers", difficulty: 2 },
  // verbs
  { id: "v1", es: "comer", en: "to eat", category: "verbs", difficulty: 1 },
  { id: "v2", es: "beber", en: "to drink", category: "verbs", difficulty: 2 },
  { id: "v3", es: "correr", en: "to run", category: "verbs", difficulty: 2 },
  { id: "v4", es: "hablar", en: "to speak", category: "verbs", difficulty: 2 },
  { id: "v5", es: "vivir", en: "to live", category: "verbs", difficulty: 2 },
  { id: "v6", es: "aprender", en: "to learn", category: "verbs", difficulty: 3 },
  // colors
  { id: "c1", es: "rojo", en: "red", category: "colors", difficulty: 1 },
  { id: "c2", es: "azul", en: "blue", category: "colors", difficulty: 1 },
  { id: "c3", es: "verde", en: "green", category: "colors", difficulty: 1 },
  { id: "c4", es: "amarillo", en: "yellow", category: "colors", difficulty: 2 },
  { id: "c5", es: "morado", en: "purple", category: "colors", difficulty: 2 },
  // time
  { id: "ti1", es: "hoy", en: "today", category: "time", difficulty: 1 },
  { id: "ti2", es: "mañana", en: "tomorrow", category: "time", difficulty: 2 },
  { id: "ti3", es: "ayer", en: "yesterday", category: "time", difficulty: 2 },
  { id: "ti4", es: "semana", en: "week", category: "time", difficulty: 2 },
  { id: "ti5", es: "año", en: "year", category: "time", difficulty: 1 },
];

export const LEVELS = [
  { id: 1, name: "Sprout", goal: 5, categories: ["greetings"] as Category[] },
  { id: 2, name: "Hopper", goal: 8, categories: ["greetings", "numbers"] as Category[] },
  { id: 3, name: "Explorer", goal: 10, categories: ["food", "colors"] as Category[] },
  { id: 4, name: "Wanderer", goal: 12, categories: ["travel", "time"] as Category[] },
  { id: 5, name: "Linguist", goal: 15, categories: ["verbs", "family"] as Category[] },
  { id: 6, name: "Maestro", goal: 20, categories: ["greetings", "food", "travel", "family", "numbers", "verbs", "colors", "time"] as Category[] },
];

// Half-Life Regression: recall probability = 2^(-elapsed_hours / halfLife)
export function recallProbability(stat: WordStat | undefined, now = Date.now()): number {
  if (!stat || stat.seen === 0) return 0;
  const hours = (now - stat.lastSeen) / 36e5;
  return Math.pow(2, -hours / Math.max(stat.halfLife, 0.1));
}

export function masteryScore(stat: WordStat | undefined): number {
  if (!stat || stat.seen === 0) return 0;
  const acc = stat.correct / stat.seen;
  const hl = Math.min(stat.halfLife / 168, 1); // cap at 1 week
  return Math.round((acc * 0.6 + hl * 0.4) * 100);
}

export function updateStat(stat: WordStat | undefined, correct: boolean, id: string): WordStat {
  const now = Date.now();
  const base: WordStat = stat ?? { id, seen: 0, correct: 0, lastSeen: now, halfLife: 1 };
  const newHL = correct
    ? Math.min(base.halfLife * 2.2 + 0.5, 720) // up to 30 days
    : Math.max(base.halfLife * 0.4, 0.25);
  return {
    id,
    seen: base.seen + 1,
    correct: base.correct + (correct ? 1 : 0),
    lastSeen: now,
    halfLife: newHL,
  };
}
