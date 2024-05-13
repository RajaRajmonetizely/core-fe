import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProductsState {
  products: any[];
  selectedProduct: {};
  isProductLoading: boolean;
}

export const initialState: ProductsState = {
  products: [],
  selectedProduct: {},
  isProductLoading: false,
};

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProductToList: (state, action: PayloadAction<any>) => {
      if (action.payload?.id) {
        state.products = [action.payload].concat(state.products);
      }
    },
    setProductList: (state, action: PayloadAction<any>) => {
      state.products = action.payload;
    },
    updateProducts: (state, action: PayloadAction<any>) => {
      const prodIndex = state.products.findIndex((p: any) => p.id === action.payload.data.id);
      if (prodIndex > -1) {
        state.products[prodIndex] = action.payload.data;
      }
    },
    deleteProduct: (state, action: PayloadAction<any>) => {
      const prodIndex = state.products.findIndex((p: any) => p.id === action.payload.data.id);
      if (prodIndex > -1) {
        state.products.splice(prodIndex, 1);
      }
    },
    setSelectedProduct: (state, action: PayloadAction<any>) => {
      state.selectedProduct = action.payload;
    },
    setIsProductLoading: (state, action: PayloadAction<any>) => {
      state.isProductLoading = action.payload;
    },
  },
});

export const {
  setProductList,
  addProductToList,
  updateProducts,
  deleteProduct,
  setSelectedProduct,
  setIsProductLoading,
} = productSlice.actions;
