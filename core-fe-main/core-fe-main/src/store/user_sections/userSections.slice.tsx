import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserSectionState {
  section: {
    id: string;
    operationName: string;
    name: string;
    route: string;
  };
}

export const initialState: UserSectionState = {
  section: {
    id: '',
    operationName: '',
    name: '',
    route: '',
  },
};

export const userSectionSlice = createSlice({
  name: 'userSection',
  initialState,
  reducers: {
    setSection: (state, action: PayloadAction<any>) => {
      state.section.id = action.payload.id;
      state.section.operationName = action.payload.operationName;
      state.section.name = action.payload.name;
      state.section.route = action.payload.route;
      localStorage.setItem('ActiveSection', JSON.stringify(state.section));
    },
  },
});

export const { setSection } = userSectionSlice.actions;
