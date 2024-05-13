import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface BaseState {
  feature: any;
  isOpen: boolean;
}

export const initialState: BaseState = {
  feature: {},
  isOpen: false,
};

export const editFeatureSlice = createSlice({
  name: 'editFeature',
  initialState,
  reducers: {
    showEditFeaturePopup: (state, action: PayloadAction<any>) => {
      state.isOpen = action.payload.isOpen;
      state.feature = action.payload.feature;
    },
    hideEditFeaturePopup: (state) => {
      state.isOpen = false;
      state.feature = {};
    },
  },
});

export const { showEditFeaturePopup, hideEditFeaturePopup } = editFeatureSlice.actions;
