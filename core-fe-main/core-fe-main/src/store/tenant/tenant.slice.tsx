import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TenantState {
  tenants: any[];
  isEditMode: boolean;
  editTenantData: any;
  refetchData: boolean;
  selectedRow: any;
  tenantUsers: any;
}

export const initialState: TenantState = {
  tenants: [],
  isEditMode: false,
  editTenantData: {},
  refetchData: false,
  selectedRow: null,
  tenantUsers: [],
};

export const tenantSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    setTenants: (state, action: PayloadAction<any>) => {
      state.tenants = action.payload;
    },
    deleteTenant: (state, action: PayloadAction<any>) => {
      const index = state.tenants.findIndex((p: any) => p.id === action.payload.id);
      state.tenants.splice(index, 1);
    },
    setEditMode: (state, action: PayloadAction<any>) => {
      state.isEditMode = action.payload;
    },
    setEditData: (state, action: PayloadAction<any>) => {
      state.editTenantData = action.payload;
    },
    setRefetchData: (state, action: PayloadAction<any>) => {
      state.refetchData = action.payload;
    },
    setSelectedRow: (state, action: PayloadAction<any>) => {
      state.selectedRow = action.payload;
    },
    setTenantUsers: (state, action: PayloadAction<any>) => {
      state.tenantUsers = action.payload;
    },
  },
});

export const {
  setTenants,
  deleteTenant,
  setEditMode,
  setEditData,
  setRefetchData,
  setSelectedRow,
  setTenantUsers,
} = tenantSlice.actions;
