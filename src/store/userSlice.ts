// src/store/userSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile, ShopItem } from "../types";

const todayStr = new Date().toISOString().split("T")[0];

interface ExtendedUserProfile extends UserProfile {
  lastStudyDate: string | null;
}

const getLocalProfile = (): ExtendedUserProfile | null => {
  const saved = localStorage.getItem("user_profile");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const localProfile = getLocalProfile();

const initialState: ExtendedUserProfile = {
  id: localProfile?.id || "guest-user",
  name: localProfile?.name || "Student",
  email: localProfile?.email || "",
  streak: localProfile?.streak !== undefined ? localProfile.streak : 0,
  diamonds: localProfile?.diamonds !== undefined ? localProfile.diamonds : 5000, // Đã chỉnh 5000 để test
  ownedItems: localProfile?.ownedItems || [],
  currentAvatar:
    localProfile?.currentAvatar ||
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
  ownedAvatars: localProfile?.ownedAvatars || [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
  ],
  exp: localProfile?.exp !== undefined ? localProfile.exp : 0,
  lastStudyDate: localProfile?.lastStudyDate || null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<Partial<ExtendedUserProfile>>) {
      const updated = { ...state, ...action.payload };
      localStorage.setItem("user_profile", JSON.stringify(updated));
      return updated;
    },
    setDiamonds(state, action: PayloadAction<number>) {
      state.diamonds = action.payload;
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
    addDiamonds(state, action: PayloadAction<number>) {
      state.diamonds += action.payload;
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
    addExp(state, action: PayloadAction<number>) {
      state.exp += action.payload;
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
    buyItem(state, action: PayloadAction<ShopItem>) {
      const item = action.payload;
      if (state.diamonds >= item.price) {
        state.diamonds -= item.price;
        if (!state.ownedItems.includes(item.id)) {
          state.ownedItems.push(item.id);
        }
        localStorage.setItem("user_profile", JSON.stringify(state));
      }
    },
    incrementStreak(state) {
      state.streak += 1;
      state.lastStudyDate = todayStr;
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
    checkAndResetStreak(state) {
      if (!state.lastStudyDate) return;
      const today = new Date();
      const lastDate = new Date(state.lastStudyDate);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) {
        state.streak = 0;
        localStorage.setItem("user_profile", JSON.stringify(state));
      }
    },
    resetStreak(state) {
      state.streak = 0;
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
    setPet(state, action: PayloadAction<string>) {
      state.petId = action.payload;
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
    setCurrentAvatar(state, action: PayloadAction<string>) {
      state.currentAvatar = action.payload;
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
    addOwnedAvatar(state, action: PayloadAction<string>) {
      if (!state.ownedAvatars.includes(action.payload)) {
        state.ownedAvatars.push(action.payload);
      }
      localStorage.setItem("user_profile", JSON.stringify(state));
    },
  },
});

export const {
  setUserProfile,
  setDiamonds,
  addDiamonds,
  addExp,
  buyItem,
  incrementStreak,
  checkAndResetStreak,
  resetStreak,
  setPet,
  setCurrentAvatar,
  addOwnedAvatar,
} = userSlice.actions;

export const purchaseItem = buyItem; // Alias bảo hiểm cho file Shop.tsx
export default userSlice.reducer;
