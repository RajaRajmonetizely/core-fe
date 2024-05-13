import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TemplateState {
  templates: any[];
  isEditMode: boolean;
  editTemplateData: any;
  refetchData: boolean;
}

export const initialState: TemplateState = {
  templates: [],
  isEditMode: false,
  editTemplateData: {},
  refetchData: false,
};

export const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    setTemplates: (state, action: PayloadAction<any>) => {
      state.templates = action.payload;
    },
    deleteTemplate: (state, action: PayloadAction<any>) => {
      const index = state.templates.findIndex((p: any) => p.id === action.payload.id);
      state.templates.splice(index, 1);
    },
    setEditMode: (state, action: PayloadAction<any>) => {
      state.isEditMode = action.payload;
    },
    setEditData: (state, action: PayloadAction<any>) => {
      state.editTemplateData = action.payload;
    },
    setRefetchData: (state, action: PayloadAction<any>) => {
      state.refetchData = action.payload;
    },
  },
});

export const { setTemplates, deleteTemplate, setEditMode, setEditData, setRefetchData } =
  templateSlice.actions;
