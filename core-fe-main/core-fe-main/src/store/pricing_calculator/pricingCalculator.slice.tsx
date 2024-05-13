import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PricingCalculatorState {
  selectedOpportunity: any;
  selectedPricingBook: any;
  selectedQuote: any;
  selectedPricingProducts: any;
  priceBookDetails: any;
  quoteVersions: any;
  priceBookDiscounts: any;
  selectedQuoteDetails: any;
  dealTerms: any;
  dealTermsSchema: any;
}

export const initialState: PricingCalculatorState = {
  selectedOpportunity: {},
  selectedPricingBook: {},
  selectedPricingProducts: [],
  quoteVersions: [],
  priceBookDiscounts: [],
  selectedQuote: {},
  priceBookDetails: {},
  selectedQuoteDetails: {},
  dealTerms: {},
  dealTermsSchema: {},
};

export const pricingCalculatorSlice = createSlice({
  name: 'pricingCalculator',
  initialState,
  reducers: {
    setSelectedOpportunity: (state, action: PayloadAction<any>) => {
      state.selectedOpportunity = action.payload;
    },
    setSelectedPricingBook: (state, action: PayloadAction<any>) => {
      state.selectedPricingBook = action.payload;
    },
    setPriceBookDetails: (state, action: PayloadAction<any>) => {
      state.priceBookDetails = action.payload;
    },
    setSelectedPricingProducts: (state, action: PayloadAction<any>) => {
      state.selectedPricingProducts = action.payload;
    },
    setSelectedQuote: (state, action: PayloadAction<any>) => {
      state.selectedQuote = action.payload;
    },
    setQuoteVersions: (state, action: PayloadAction<any>) => {
      state.quoteVersions = action.payload;
    },
    setPriceBookDiscount: (state, action: PayloadAction<any>) => {
      state.priceBookDiscounts = action.payload;
    },
    setSelectedQuoteDetails: (state, action: PayloadAction<any>) => {
      state.selectedQuoteDetails = action.payload;
    },
    setDealTerms: (state, action: PayloadAction<any>) => {
      state.dealTerms = action.payload;
    },
    setDealTermsSchema: (state, action: PayloadAction<any>) => {
      state.dealTermsSchema = action.payload;
    },
  },
});

export const {
  setSelectedOpportunity,
  setSelectedPricingBook,
  setSelectedPricingProducts,
  setPriceBookDetails,
  setSelectedQuote,
  setQuoteVersions,
  setPriceBookDiscount,
  setSelectedQuoteDetails,
  setDealTerms,
  setDealTermsSchema,
} = pricingCalculatorSlice.actions;
