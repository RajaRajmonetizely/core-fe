import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AccountState {
  accounts: any[];
  isEditMode: boolean;
  editAccountData: any;
  refetchData: boolean;
  isDisabledMode: boolean;
  isDetailedMode: boolean;
}

export const initialState: AccountState = {
  accounts: [],
  isEditMode: false,
  editAccountData: {},
  refetchData: false,
  isDisabledMode: false,
  isDetailedMode: false,
};

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<any>) => {
      state.accounts = action.payload;
    },
    deleteAccount: (state, action: PayloadAction<any>) => {
      const index = state.accounts.findIndex((p: any) => p.id === action.payload.id);
      state.accounts.splice(index, 1);
    },
    setEditMode: (state, action: PayloadAction<any>) => {
      state.isEditMode = action.payload;
    },
    setEditData: (state, action: PayloadAction<any>) => {
      state.editAccountData = action.payload;
    },
    setRefetchData: (state, action: PayloadAction<any>) => {
      state.refetchData = action.payload;
    },
    setDisabledMode: (state, action: PayloadAction<any>) => {
      state.isDisabledMode = action.payload;
    },
    setDetailedMode: (state, action: PayloadAction<any>) => {
      state.isDetailedMode = action.payload;
    },
  },
});

export const {
  setAccounts,
  deleteAccount,
  setEditMode,
  setEditData,
  setRefetchData,
  setDisabledMode,
  setDetailedMode,
} = accountSlice.actions;
