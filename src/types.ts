// src/types.ts
// Type definitions for the Timetable Gamified AI‑Powered Web App

/** Subject (a class or event) displayed on the calendar */
export interface Subject {
  id: string;               // unique identifier
  name: string;             // e.g. "Calculus I"
  teacher?: string;         // optional teacher name
  room?: string;            // optional classroom
  color?: string;           // hex colour for UI representation
  startTime: string;        // ISO‑time string, e.g. "08:30"
  endTime: string;          // ISO‑time string, e.g. "10:00"
  daysOfWeek: number[];     // 0 = Monday … 6 = Sunday
  recurring?: boolean;      // true if the event repeats weekly
}

/** State of the Pomodoro / focus timer */
export interface TimerState {
  isRunning: boolean;       // true when timer is active
  mode: 'pomodoro' | 'stopwatch';
  duration: number;         // total seconds for the current session
  remaining: number;        // seconds left (for pomodoro)
  subjectId?: string;       // id of the Subject being timed (optional)
}

/** User profile storing gamification data */
export interface UserProfile {
  id: string;
  name: string;
  streak: number;           // consecutive days with study activity
  diamonds: number;         // earned currency
  ownedItems: string[];     // ids of ShopItem purchased
  petId?: string;           // id of the selected virtual pet
}

/** Item available in the reward shop */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;            // cost in diamonds
  iconUrl?: string;         // optional image for UI
}

/** Message exchanged with the AI assistant */
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;        // ISO‑8601 timestamp
}