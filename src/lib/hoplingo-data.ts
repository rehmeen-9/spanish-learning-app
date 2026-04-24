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
  { id: "g8", es: "buenas tardes", en: "good afternoon", category: "greetings", difficulty: 2 },
  { id: "g9", es: "hasta luego", en: "see you later", category: "greetings", difficulty: 2 },
  { id: "g10", es: "de nada", en: "you're welcome", category: "greetings", difficulty: 2 },
  { id: "g11", es: "perdón", en: "excuse me", category: "greetings", difficulty: 1 },
  { id: "g12", es: "¿cómo estás?", en: "how are you?", category: "greetings", difficulty: 2 },
  { id: "g13", es: "mucho gusto", en: "nice to meet you", category: "greetings", difficulty: 3 },
  { id: "g14", es: "bienvenido", en: "welcome", category: "greetings", difficulty: 2 },
  { id: "g15", es: "sí", en: "yes", category: "greetings", difficulty: 1 },
  { id: "g16", es: "no", en: "no", category: "greetings", difficulty: 1 },

  // food
  { id: "f1", es: "manzana", en: "apple", category: "food", difficulty: 1 },
  { id: "f2", es: "pan", en: "bread", category: "food", difficulty: 1 },
  { id: "f3", es: "queso", en: "cheese", category: "food", difficulty: 2 },
  { id: "f4", es: "agua", en: "water", category: "food", difficulty: 1 },
  { id: "f5", es: "café", en: "coffee", category: "food", difficulty: 1 },
  { id: "f6", es: "huevo", en: "egg", category: "food", difficulty: 2 },
  { id: "f7", es: "pollo", en: "chicken", category: "food", difficulty: 2 },
  { id: "f8", es: "arroz", en: "rice", category: "food", difficulty: 2 },
  { id: "f9", es: "leche", en: "milk", category: "food", difficulty: 1 },
  { id: "f10", es: "carne", en: "meat", category: "food", difficulty: 2 },
  { id: "f11", es: "pescado", en: "fish", category: "food", difficulty: 2 },
  { id: "f12", es: "fruta", en: "fruit", category: "food", difficulty: 1 },
  { id: "f13", es: "verdura", en: "vegetable", category: "food", difficulty: 2 },
  { id: "f14", es: "naranja", en: "orange", category: "food", difficulty: 1 },
  { id: "f15", es: "plátano", en: "banana", category: "food", difficulty: 2 },
  { id: "f16", es: "tomate", en: "tomato", category: "food", difficulty: 2 },
  { id: "f17", es: "sopa", en: "soup", category: "food", difficulty: 1 },
  { id: "f18", es: "azúcar", en: "sugar", category: "food", difficulty: 2 },
  { id: "f19", es: "sal", en: "salt", category: "food", difficulty: 1 },
  { id: "f20", es: "mantequilla", en: "butter", category: "food", difficulty: 3 },
  { id: "f21", es: "helado", en: "ice cream", category: "food", difficulty: 2 },
  { id: "f22", es: "cena", en: "dinner", category: "food", difficulty: 2 },

  // travel
  { id: "t1", es: "aeropuerto", en: "airport", category: "travel", difficulty: 3 },
  { id: "t2", es: "tren", en: "train", category: "travel", difficulty: 1 },
  { id: "t3", es: "boleto", en: "ticket", category: "travel", difficulty: 2 },
  { id: "t4", es: "maleta", en: "suitcase", category: "travel", difficulty: 2 },
  { id: "t5", es: "hotel", en: "hotel", category: "travel", difficulty: 1 },
  { id: "t6", es: "playa", en: "beach", category: "travel", difficulty: 2 },
  { id: "t7", es: "coche", en: "car", category: "travel", difficulty: 1 },
  { id: "t8", es: "autobús", en: "bus", category: "travel", difficulty: 2 },
  { id: "t9", es: "avión", en: "airplane", category: "travel", difficulty: 2 },
  { id: "t10", es: "mapa", en: "map", category: "travel", difficulty: 1 },
  { id: "t11", es: "calle", en: "street", category: "travel", difficulty: 2 },
  { id: "t12", es: "ciudad", en: "city", category: "travel", difficulty: 2 },
  { id: "t13", es: "país", en: "country", category: "travel", difficulty: 2 },
  { id: "t14", es: "pasaporte", en: "passport", category: "travel", difficulty: 3 },
  { id: "t15", es: "estación", en: "station", category: "travel", difficulty: 3 },
  { id: "t16", es: "viaje", en: "trip", category: "travel", difficulty: 2 },
  { id: "t17", es: "montaña", en: "mountain", category: "travel", difficulty: 2 },
  { id: "t18", es: "río", en: "river", category: "travel", difficulty: 1 },

  // family
  { id: "fa1", es: "madre", en: "mother", category: "family", difficulty: 1 },
  { id: "fa2", es: "padre", en: "father", category: "family", difficulty: 1 },
  { id: "fa3", es: "hermano", en: "brother", category: "family", difficulty: 2 },
  { id: "fa4", es: "hermana", en: "sister", category: "family", difficulty: 2 },
  { id: "fa5", es: "hijo", en: "son", category: "family", difficulty: 2 },
  { id: "fa6", es: "abuela", en: "grandmother", category: "family", difficulty: 3 },
  { id: "fa7", es: "abuelo", en: "grandfather", category: "family", difficulty: 3 },
  { id: "fa8", es: "hija", en: "daughter", category: "family", difficulty: 2 },
  { id: "fa9", es: "tío", en: "uncle", category: "family", difficulty: 2 },
  { id: "fa10", es: "tía", en: "aunt", category: "family", difficulty: 2 },
  { id: "fa11", es: "primo", en: "cousin (m)", category: "family", difficulty: 2 },
  { id: "fa12", es: "esposo", en: "husband", category: "family", difficulty: 2 },
  { id: "fa13", es: "esposa", en: "wife", category: "family", difficulty: 2 },
  { id: "fa14", es: "amigo", en: "friend (m)", category: "family", difficulty: 1 },
  { id: "fa15", es: "amiga", en: "friend (f)", category: "family", difficulty: 1 },
  { id: "fa16", es: "bebé", en: "baby", category: "family", difficulty: 1 },

  // numbers
  { id: "n1", es: "uno", en: "one", category: "numbers", difficulty: 1 },
  { id: "n2", es: "dos", en: "two", category: "numbers", difficulty: 1 },
  { id: "n3", es: "tres", en: "three", category: "numbers", difficulty: 1 },
  { id: "n4", es: "cuatro", en: "four", category: "numbers", difficulty: 1 },
  { id: "n5", es: "cinco", en: "five", category: "numbers", difficulty: 1 },
  { id: "n6", es: "seis", en: "six", category: "numbers", difficulty: 1 },
  { id: "n7", es: "siete", en: "seven", category: "numbers", difficulty: 1 },
  { id: "n8", es: "ocho", en: "eight", category: "numbers", difficulty: 1 },
  { id: "n9", es: "nueve", en: "nine", category: "numbers", difficulty: 1 },
  { id: "n10", es: "diez", en: "ten", category: "numbers", difficulty: 1 },
  { id: "n11", es: "veinte", en: "twenty", category: "numbers", difficulty: 2 },
  { id: "n12", es: "treinta", en: "thirty", category: "numbers", difficulty: 2 },
  { id: "n13", es: "cincuenta", en: "fifty", category: "numbers", difficulty: 2 },
  { id: "n14", es: "cien", en: "hundred", category: "numbers", difficulty: 2 },
  { id: "n15", es: "mil", en: "thousand", category: "numbers", difficulty: 2 },

  // verbs
  { id: "v1", es: "comer", en: "to eat", category: "verbs", difficulty: 1 },
  { id: "v2", es: "beber", en: "to drink", category: "verbs", difficulty: 2 },
  { id: "v3", es: "correr", en: "to run", category: "verbs", difficulty: 2 },
  { id: "v4", es: "hablar", en: "to speak", category: "verbs", difficulty: 2 },
  { id: "v5", es: "vivir", en: "to live", category: "verbs", difficulty: 2 },
  { id: "v6", es: "aprender", en: "to learn", category: "verbs", difficulty: 3 },
  { id: "v7", es: "ser", en: "to be (perm)", category: "verbs", difficulty: 2 },
  { id: "v8", es: "estar", en: "to be (state)", category: "verbs", difficulty: 2 },
  { id: "v9", es: "tener", en: "to have", category: "verbs", difficulty: 2 },
  { id: "v10", es: "ir", en: "to go", category: "verbs", difficulty: 1 },
  { id: "v11", es: "hacer", en: "to do/make", category: "verbs", difficulty: 2 },
  { id: "v12", es: "ver", en: "to see", category: "verbs", difficulty: 1 },
  { id: "v13", es: "leer", en: "to read", category: "verbs", difficulty: 2 },
  { id: "v14", es: "escribir", en: "to write", category: "verbs", difficulty: 3 },
  { id: "v15", es: "dormir", en: "to sleep", category: "verbs", difficulty: 2 },
  { id: "v16", es: "querer", en: "to want", category: "verbs", difficulty: 2 },
  { id: "v17", es: "poder", en: "to be able", category: "verbs", difficulty: 3 },
  { id: "v18", es: "saber", en: "to know (fact)", category: "verbs", difficulty: 2 },
  { id: "v19", es: "trabajar", en: "to work", category: "verbs", difficulty: 2 },
  { id: "v20", es: "comprar", en: "to buy", category: "verbs", difficulty: 2 },

  // colors
  { id: "c1", es: "rojo", en: "red", category: "colors", difficulty: 1 },
  { id: "c2", es: "azul", en: "blue", category: "colors", difficulty: 1 },
  { id: "c3", es: "verde", en: "green", category: "colors", difficulty: 1 },
  { id: "c4", es: "amarillo", en: "yellow", category: "colors", difficulty: 2 },
  { id: "c5", es: "morado", en: "purple", category: "colors", difficulty: 2 },
  { id: "c6", es: "negro", en: "black", category: "colors", difficulty: 1 },
  { id: "c7", es: "blanco", en: "white", category: "colors", difficulty: 1 },
  { id: "c8", es: "naranja", en: "orange", category: "colors", difficulty: 2 },
  { id: "c9", es: "rosa", en: "pink", category: "colors", difficulty: 1 },
  { id: "c10", es: "marrón", en: "brown", category: "colors", difficulty: 2 },
  { id: "c11", es: "gris", en: "gray", category: "colors", difficulty: 1 },
  { id: "c12", es: "dorado", en: "golden", category: "colors", difficulty: 3 },

  // time
  { id: "ti1", es: "hoy", en: "today", category: "time", difficulty: 1 },
  { id: "ti2", es: "mañana", en: "tomorrow", category: "time", difficulty: 2 },
  { id: "ti3", es: "ayer", en: "yesterday", category: "time", difficulty: 2 },
  { id: "ti4", es: "semana", en: "week", category: "time", difficulty: 2 },
  { id: "ti5", es: "año", en: "year", category: "time", difficulty: 1 },
  { id: "ti6", es: "mes", en: "month", category: "time", difficulty: 1 },
  { id: "ti7", es: "día", en: "day", category: "time", difficulty: 1 },
  { id: "ti8", es: "noche", en: "night", category: "time", difficulty: 1 },
  { id: "ti9", es: "hora", en: "hour", category: "time", difficulty: 1 },
  { id: "ti10", es: "minuto", en: "minute", category: "time", difficulty: 2 },
  { id: "ti11", es: "tarde", en: "afternoon/late", category: "time", difficulty: 2 },
  { id: "ti12", es: "temprano", en: "early", category: "time", difficulty: 3 },
  { id: "ti13", es: "siempre", en: "always", category: "time", difficulty: 2 },
  { id: "ti14", es: "nunca", en: "never", category: "time", difficulty: 2 },
  { id: "ti15", es: "ahora", en: "now", category: "time", difficulty: 1 },
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
