import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITier } from '../../models/plan';
import {
  IMetrics,
  IPricingStructure,
  IPricingModel,
  ICoreDetails,
} from '../../models/pricing-model';

export interface PricingModelState {
  pricingModelTabs: any[];
  selectedTabValue: number;
  pricingStructure: IPricingStructure[];
  pricingMetrics: IMetrics[];
  selectedPriceMetric: IMetrics[];
  selectedPriceStructure: IPricingStructure;
  rowData: any;
  rows: any;
  selectedColumns: any;
  pricingModels: IPricingModel[];
  selectedPricingModel: IPricingModel;
  coreTierDetails: ICoreDetails[];
  customTabData: {};
  modelDetails: IPricingModel;
  pricingCurveModel: IPricingModel;
  tierWiseAddOnValues: any;
  addonConfig: any;
  simulationTier: ITier;
  simulationPricingModel: IPricingModel;
  simulationRowData: any;
  simulationTierwiseRowData: any;
}

export const initialState: PricingModelState = {
  pricingModelTabs: [],
  selectedTabValue: 0,
  pricingStructure: [],
  pricingMetrics: [],
  pricingModels: [],
  selectedPriceMetric: [],
  selectedPriceStructure: {} as IPricingStructure,
  rowData: {},
  rows: [],
  selectedColumns: [],
  selectedPricingModel: {} as IPricingModel,
  coreTierDetails: [],
  customTabData: {},
  modelDetails: {} as IPricingModel,
  pricingCurveModel: {} as IPricingModel,
  tierWiseAddOnValues: {},
  addonConfig: { columns: [], values: [] },
  simulationTier: {} as ITier,
  simulationPricingModel: {} as IPricingModel,
  simulationRowData: {},
  simulationTierwiseRowData: {},
};

export const pricingModelSlice = createSlice({
  name: 'pricingModel',
  initialState,
  reducers: {
    clearData: (state) => {
      state.pricingModelTabs = [];
      state.selectedTabValue = 0;
      state.selectedPriceMetric = [];
      state.selectedPriceStructure = {} as IPricingStructure;
      state.rowData = {};
      state.rows = [];
      state.selectedColumns = [];
      state.selectedPricingModel = {} as IPricingModel;
      state.coreTierDetails = [];
      state.customTabData = {};
      state.modelDetails = {} as IPricingModel;
      state.pricingCurveModel = {} as IPricingModel;
      state.tierWiseAddOnValues = {};
      state.addonConfig = { columns: [], values: [] };
      state.simulationTier = {} as ITier;
      state.simulationPricingModel = {} as IPricingModel;
      state.simulationRowData = [];
    },
    setPricingModelTabs: (state, action: PayloadAction<any>) => {
      state.pricingModelTabs = action.payload;
    },
    setSelectedTabValue: (state, action: PayloadAction<any>) => {
      state.selectedTabValue = action.payload;
    },
    updatePricingModelTabs: (state, action: PayloadAction<any>) => {
      state.pricingModelTabs.splice(-2, 0, action.payload);
    },
    setPricingStructure: (state, action: PayloadAction<any>) => {
      state.pricingStructure = action.payload;
    },
    setPricingMetrics: (state, action: PayloadAction<any>) => {
      state.pricingMetrics = action.payload;
    },
    updatePricingMetrics: (state, action: PayloadAction<any>) => {
      state.pricingMetrics.push(action.payload);
    },
    setSelectedPricingModel: (state, action: PayloadAction<any>) => {
      state.selectedPricingModel = action.payload;
    },
    setPricingModel: (state, action: PayloadAction<any>) => {
      state.pricingModels = action.payload;
    },
    updatePricingModel: (state, action: PayloadAction<any>) => {
      state.pricingModels.push(action.payload);
    },
    setSelectedPriceMetric: (state, action: PayloadAction<any>) => {
      state.selectedPriceMetric = action.payload;
    },
    setSelectedPriceStructure: (state, action: PayloadAction<any>) => {
      state.selectedPriceStructure = action.payload;
    },
    setRowData: (state, action: PayloadAction<any>) => {
      state.rowData = action.payload;
    },
    setSelectedColumns: (state, action: PayloadAction<any>) => {
      state.selectedColumns = action.payload;
    },
    setRows: (state, action: PayloadAction<any>) => {
      state.rows = action.payload;
    },
    setCoreTierDetails: (state, action: PayloadAction<any>) => {
      state.coreTierDetails = action.payload;
    },
    setModelDetails: (state, action: PayloadAction<any>) => {
      state.modelDetails = action.payload;
    },
    setCustomTabData: (state, action: PayloadAction<any>) => {
      state.customTabData = { ...state.customTabData, ...action.payload };
    },
    setTierWiseAddOnValues: (state, action: PayloadAction<any>) => {
      state.tierWiseAddOnValues = action.payload;
    },
    setPricingCurveModel: (state, action: PayloadAction<any>) => {
      state.pricingCurveModel = action.payload;
    },
    setAddonConfigData: (state, action: PayloadAction<any>) => {
      state.addonConfig = action.payload;
    },
    setSimulationTier: (state, action: PayloadAction<any>) => {
      state.simulationTier = action.payload;
    },
    setSimulationModel: (state, action: PayloadAction<any>) => {
      state.simulationPricingModel = action.payload;
    },
    setSimulationRowData: (state, action: PayloadAction<any>) => {
      state.simulationRowData = action.payload;
    },
    setSimulationTierwiseRowData: (state, action: PayloadAction<any>) => {
      state.simulationTierwiseRowData = action.payload;
    },
  },
});

export const {
  clearData,
  setPricingModelTabs,
  setSelectedTabValue,
  updatePricingModelTabs,
  setPricingStructure,
  setSelectedPricingModel,
  setPricingMetrics,
  updatePricingMetrics,
  setPricingModel,
  updatePricingModel,
  setSelectedPriceMetric,
  setSelectedPriceStructure,
  setRowData,
  setSelectedColumns,
  setRows,
  setCoreTierDetails,
  setCustomTabData,
  setModelDetails,
  setTierWiseAddOnValues,
  setPricingCurveModel,
  setAddonConfigData,
  setSimulationTier,
  setSimulationModel,
  setSimulationRowData,
  setSimulationTierwiseRowData,
} = pricingModelSlice.actions;
