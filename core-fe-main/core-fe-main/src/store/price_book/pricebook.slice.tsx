import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PriceBookState {
  priceBooks: any[];
  isEditMode: boolean;
  editPriceBookData: any;
  refetchData: boolean;
}

export const initialState: PriceBookState = {
  priceBooks: [],
  isEditMode: false,
  editPriceBookData: {},
  refetchData: false,
};

export const priceBookSlice = createSlice({
  name: 'priceBook',
  initialState,
  reducers: {
    setPriceBooks: (state, action: PayloadAction<any>) => {
      state.priceBooks = action.payload;
    },
    deletePriceBook: (state, action: PayloadAction<any>) => {
      const index = state.priceBooks.findIndex((p: any) => p.id === action.payload.id);
      state.priceBooks.splice(index, 1);
    },
    setEditMode: (state, action: PayloadAction<any>) => {
      state.isEditMode = action.payload;
    },
    setEditData: (state, action: PayloadAction<any>) => {
      state.editPriceBookData = action.payload;
    },
    setRefetchData: (state, action: PayloadAction<any>) => {
      state.refetchData = action.payload;
    },
  },
});

export const { setPriceBooks, deletePriceBook, setEditMode, setEditData, setRefetchData } =
  priceBookSlice.actions;
