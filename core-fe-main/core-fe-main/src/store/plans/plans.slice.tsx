import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PlansState {
  plans: any[];
  currentPlan: {};
  currentTierList: [];
  currentSelectedProduct: {};
}

export const initialState: PlansState = {
  plans: [],
  currentPlan: {},
  currentTierList: [],
  currentSelectedProduct: {},
};

export const planSlice = createSlice({
  name: 'plans',
  initialState,
  reducers: {
    setPlans: (state, action: PayloadAction<any>) => {
      state.plans = action.payload;
    },
    updatePlans: (state, action: PayloadAction<any>) => {
      const planIndex = state.plans.findIndex((p: any) => p.id === action.payload.id);
      if (planIndex === -1) state.plans = [...state.plans, action.payload];
      else state.plans[planIndex] = action.payload;
    },
    setCurrentPlan: (state, action: PayloadAction<any>) => {
      state.currentPlan = action.payload;
    },
    setCurrentSelectedProduct: (state, action: PayloadAction<any>) => {
      state.currentSelectedProduct = action.payload;
    },
    setCurrentTierList: (state, action: PayloadAction<any>) => {
      state.currentTierList = action.payload;
    },
  },
});

export const {
  setPlans,
  updatePlans,
  setCurrentPlan,
  setCurrentSelectedProduct,
  setCurrentTierList,
} = planSlice.actions;
