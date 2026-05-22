// src/store/userSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile, ShopItem } from '../types.js';

// Initial state for the user profile
const initialState: UserProfile = {
  id: 'user-001',
  name: 'Student',
  streak: 0,
  diamonds: 0,
  ownedItems: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Add diamonds when study session completes
    addDiamonds(state, action: PayloadAction<number>) {
      state.diamonds += action.payload;
    },
    // Subtract diamonds when purchasing an item
    purchaseItem(state, action: PayloadAction<ShopItem>) {
      const item = action.payload;
      if (state.diamonds >= item.price) {
        state.diamonds -= item.price;
        if (!state.ownedItems.includes(item.id)) {
          state.ownedItems.push(item.id);
        }
      }
    },
    // Increment streak when a study day is completed
    incrementStreak(state) {
      state.streak += 1;
    },
    // Reset streak if a day is missed
    resetStreak(state) {
      state.streak = 0;
    },
    // Set the selected pet
    setPet(state, action: PayloadAction<string>) {
      state.petId = action.payload;
    },
  },
});

export const {
  addDiamonds,
  purchaseItem,
  incrementStreak,
  resetStreak,
  setPet,
} = userSlice.actions;

export default userSlice.reducer;