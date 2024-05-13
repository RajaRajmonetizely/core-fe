import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserSectionState {
  salesForceSettings: any;
  salesforceMapping: any;
  refetchData: boolean;
}

export const initialState: UserSectionState = {
  salesForceSettings: {},
  salesforceMapping: [],
  refetchData: false,
};

export const salesForceSlice = createSlice({
  name: 'salesForce',
  initialState,
  reducers: {
    setSalesForceSettings: (state, action: PayloadAction<any>) => {
      state.salesForceSettings = action.payload;
    },
    setSalesforceMapping: (state, action: PayloadAction<any>) => {
      state.salesforceMapping = action.payload;
    },
    setRefetchData: (state, action: PayloadAction<any>) => {
      state.refetchData = action.payload;
    },
  },
});

export const { setSalesForceSettings, setSalesforceMapping, setRefetchData } =
  salesForceSlice.actions;
