import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UsersState {
  users: any[];
  isEditMode: boolean;
  editUserData: any;
  refetchData: boolean;
  profileLoader: boolean;
  profileData: any;
}

export const initialState: UsersState = {
  users: [],
  isEditMode: false,
  editUserData: {},
  refetchData: false,
  profileLoader: false,
  profileData: {},
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<any>) => {
      state.users = action.payload;
    },
    deleteUser: (state, action: PayloadAction<any>) => {
      const index = state.users.findIndex((p: any) => p.id === action.payload.id);
      state.users.splice(index, 1);
    },
    setEditMode: (state, action: PayloadAction<any>) => {
      state.isEditMode = action.payload;
    },
    setEditData: (state, action: PayloadAction<any>) => {
      state.editUserData = action.payload;
    },
    setRefetchData: (state, action: PayloadAction<any>) => {
      state.refetchData = action.payload;
    },
    setProfileLoader: (state, action: PayloadAction<any>) => {
      state.profileLoader = action.payload;
    },
    setProfileData: (state, action: PayloadAction<any>) => {
      state.profileData = action.payload;
    },
  },
});

export const {
  setUsers,
  deleteUser,
  setEditMode,
  setEditData,
  setRefetchData,
  setProfileData,
  setProfileLoader,
} = usersSlice.actions;
