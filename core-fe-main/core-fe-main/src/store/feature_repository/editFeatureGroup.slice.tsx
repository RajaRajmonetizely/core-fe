import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface BaseState {
  featureGroup: any;
  isOpen: boolean;
}

export const initialState: BaseState = {
  featureGroup: {},
  isOpen: false,
};

export const editFeatureGroupSlice = createSlice({
  name: 'editFeatureGroup',
  initialState,
  reducers: {
    showEditFeatureGroupPopup: (state, action: PayloadAction<any>) => {
      state.isOpen = action.payload.isOpen;
      state.featureGroup = action.payload.featureGroup;
    },
    hideEditFeatureGroupPopup: (state) => {
      state.isOpen = false;
      state.featureGroup = {};
    },
  },
});

export const { showEditFeatureGroupPopup, hideEditFeatureGroupPopup } =
  editFeatureGroupSlice.actions;
