import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PriceBookRuleState {
  priceBookRules: any[];
  isEditMode: boolean;
  editPriceBookRuleData: any;
  refetchData: boolean;
}

export const initialState: PriceBookRuleState = {
  priceBookRules: [],
  isEditMode: false,
  editPriceBookRuleData: {},
  refetchData: false,
};

export const priceBookRulesSlice = createSlice({
  name: 'priceBookRules',
  initialState,
  reducers: {
    setPriceBookRules: (state, action: PayloadAction<any>) => {
      state.priceBookRules = action.payload;
    },
    deletePriceBook: (state, action: PayloadAction<any>) => {
      const index = state.priceBookRules.findIndex((p: any) => p.id === action.payload.id);
      state.priceBookRules.splice(index, 1);
    },
    setEditMode: (state, action: PayloadAction<any>) => {
      state.isEditMode = action.payload;
    },
    setRefetchData: (state, action: PayloadAction<any>) => {
      state.refetchData = action.payload;
    },
    setEditData: (state, action: PayloadAction<any>) => {
      state.editPriceBookRuleData = action.payload;
    },
  },
});

export const { setPriceBookRules, deletePriceBook, setEditMode, setRefetchData, setEditData } =
  priceBookRulesSlice.actions;
