import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PackageState {
  currentPackage: {};
  currentPackageList: [];
}

export const initialState: PackageState = {
  currentPackage: {},
  currentPackageList: [],
};

export const packageSlice = createSlice({
  name: 'package',
  initialState,
  reducers: {
    setCurrentPackage: (state, action: PayloadAction<any>) => {
      state.currentPackage = action.payload;
    },
    setCurrentPackageList: (state, action: PayloadAction<any>) => {
      state.currentPackageList = action.payload;
    },
  },
});

export const { setCurrentPackage, setCurrentPackageList } = packageSlice.actions;
