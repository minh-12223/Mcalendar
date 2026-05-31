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
  email?: string;
  streak: number;           // consecutive days with study activity
  diamonds: number;         // earned currency
  ownedItems: string[];     // ids of ShopItem purchased
  petId?: string;           // id of the selected virtual pet
  currentAvatar: string;    // URL or path to current avatar image
  ownedAvatars: string[];   // List of owned avatar identifiers
  exp: number;
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

/** State of the Virtual Pet (Nuôi thú cưng ảo) */
export interface PetState {
  name: string; // Tên thú cưng
  level: number; // Bắt đầu từ 1
  exp: number; // Kinh nghiệm hiện tại
  maxExp: number; // level * 100
  health: number; // Sức khỏe, 0 - 100, bắt đầu là 100
  hunger: number; // Độ no, 0 - 100, 100 là no, bắt đầu là 80
  status: "HAPPY" | "SAD" | "SLEEPING" | "HUNGRY";
  evolutionStage: "EGG" | "BABY" | "ADULT";
  petType: string;
}
