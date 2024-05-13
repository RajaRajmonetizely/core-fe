import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreatePriceBookRuleState {
  priceBooks: any[];
  designations: any[];
  users: any[];
  oppTypes: any[];
}

export const initialState: CreatePriceBookRuleState = {
  priceBooks: [],
  designations: [],
  users: [],
  oppTypes: [],
};

export const createPriceBookRulesSlice = createSlice({
  name: 'priceBookRules',
  initialState,
  reducers: {
    setPricebooks: (state, action: PayloadAction<any>) => {
      state.priceBooks = action.payload;
    },
    setDesignations: (state, action: PayloadAction<any>) => {
      state.designations = action.payload;
    },
    setUsers: (state, action: PayloadAction<any>) => {
      state.users = action.payload;
    },
    setOppTypes: (state, action: PayloadAction<any>) => {
      state.oppTypes = action.payload;
    },
  },
});

export const { setPricebooks, setDesignations, setUsers, setOppTypes } =
  createPriceBookRulesSlice.actions;
