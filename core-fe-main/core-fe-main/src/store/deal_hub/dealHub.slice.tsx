import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DealHubState {
  dealData: any[];
  dealHubFilters: any;
}

export const initialState: DealHubState = {
  dealData: [],
  dealHubFilters: {
    close_start_date: '',
    close_end_date: '',
    opportunity_owner: '',
    pricebook: '',
    assigned_to: '',
  },
};

export const dealHubSlice = createSlice({
  name: 'dealHub',
  initialState,
  reducers: {
    setOpportunityData: (state, action: PayloadAction<any>) => {
      state.dealData = action.payload;
    },
    setDealHubFilters: (state, action: PayloadAction<any>) => {
      state.dealHubFilters = action.payload;
    },
  },
});

export const { setOpportunityData, setDealHubFilters } = dealHubSlice.actions;
