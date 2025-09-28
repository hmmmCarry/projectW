// utils/normalizeGuess.ts
export function normalizeGuessStates(states: string[]): ("correct" | "present" | "absent")[] {
  return states.map((s) => {
    if (s === "green") return "correct";
    if (s === "yellow") return "present";
    if (s === "gray") return "absent";
    return "absent"; // fallback
  });
}

export function normalizeGuessPatterns(states: string[]): ("correct" | "present" | "absent" | "tbd" | "empty")[] {
  return states.map((s) => {
    if (s === "green") return "correct";
    if (s === "yellow") return "present";
    if (s === "gray") return "absent";
    if (s === "tbd") return "tbd";
    if (s === "empty") return "empty";
    return "absent"; // fallback
  });
}