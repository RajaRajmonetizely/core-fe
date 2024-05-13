import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OpportunityState {
  opportunities: any[];
  isEditMode: boolean;
  editOpportunityData: any;
  refetchData: boolean;
  isDisabledMode: boolean;
  isDetailedMode: boolean;
}

export const initialState: OpportunityState = {
  opportunities: [],
  isEditMode: false,
  editOpportunityData: {},
  refetchData: false,
  isDisabledMode: false,
  isDetailedMode: false,
};

export const opportunitySlice = createSlice({
  name: 'opportunity',
  initialState,
  reducers: {
    setOpportunities: (state, action: PayloadAction<any>) => {
      state.opportunities = action.payload;
    },
    deleteOpportunity: (state, action: PayloadAction<any>) => {
      const index = state.opportunities.findIndex((p: any) => p.id === action.payload.id);
      state.opportunities.splice(index, 1);
    },
    setEditMode: (state, action: PayloadAction<any>) => {
      state.isEditMode = action.payload;
    },
    setEditData: (state, action: PayloadAction<any>) => {
      state.editOpportunityData = action.payload;
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
  setOpportunities,
  deleteOpportunity,
  setEditMode,
  setEditData,
  setRefetchData,
  setDisabledMode,
  setDetailedMode,
} = opportunitySlice.actions;
