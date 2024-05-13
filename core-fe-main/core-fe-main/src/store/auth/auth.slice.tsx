import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { buildAbilityFor } from '../../constants/ability';

export interface AuthState {
  userName: string;
  attributes: any;
  userOperations: any;
  userRoles: any;
  ability: any;
  userId: string;
  opList: any;
}

export const initialState: AuthState = {
  userName: '',
  attributes: {},
  userOperations: {},
  userRoles: [],
  userId: '',
  ability: undefined,
  opList: [],
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<any>) => {
      state.userName = action.payload.userName;
      state.attributes = action.payload.attributes;
    },
    removeUser: (state) => {
      state.userName = '';
      state.attributes = {};
    },
    setOperations: (state, action: PayloadAction<any>) => {
      state.userOperations = action.payload.data;
      state.userRoles = action.payload.groups;
      state.userId = action.payload.user_id;
    },
    removeOperations: (state) => {
      state.userOperations = {};
      state.userRoles = [];
    },
    setAbility: (state) => {
      state.ability = buildAbilityFor(state.userOperations);
    },
    setOpList: (state, action: PayloadAction<any>) => {
      state.opList = action.payload;
    },
    logout: () => {},
  },
});

export const {
  addUser,
  setOpList,
  removeUser,
  setOperations,
  removeOperations,
  setAbility,
  logout,
} = authSlice.actions;
