import { createSlice, current, PayloadAction } from '@reduxjs/toolkit';
import products from '../../mocks/products';
import features from '../../mocks/features';
import featureGroups from '../../mocks/featureGroups';

export interface Product {
  id: string;
  name: string;
}

export interface Repository {
  id: string;
  name: string;
}

export interface Feature {
  id: string;
  name: string;
  external_name?: string;
  external_description?: string;
}

export interface FeatureGroup {
  id: string;
  name: string;
  features: Feature[];
}

export interface BaseState {
  products: Product[];
  repositories: Repository[];
  features: Feature[];
  featureGroups: FeatureGroup[];
  selectedProduct: any;
  selectedRepository: any;
}

export const initialState: BaseState = {
  products,
  repositories: [],
  features,
  featureGroups,
  selectedProduct: {},
  selectedRepository: {},
};

export const featureRepositorySlice = createSlice({
  name: 'featureRepository',
  initialState,
  reducers: {
    setRepositoriesList: (state, action: PayloadAction<any>) => {
      state.repositories = action.payload;
    },
    onRepositorySelect: (state, action: PayloadAction<any>) => {
      state.selectedRepository = action.payload.repository;
    },
    onProductSelect: (state, action: PayloadAction<any>) => {
      state.selectedProduct = action.payload.product;
    },
    addFeature: (state, action: PayloadAction<any>) => {
      state.features.push(action.payload);
    },
    addFeatureGroup: (state, action: PayloadAction<any>) => {
      state.featureGroups.push(action.payload);
    },
    updateFeature: (state, action: PayloadAction<any>) => {
      const updatedFeatures = state.features.map((f) => {
        if (f.id === action.payload.feature.id) {
          return { ...f, ...action.payload.feature };
        }
        return f;
      });
      state.features = updatedFeatures;
    },
    updateFeatureGroup: (state, action: PayloadAction<any>) => {
      const updatedFeaturesGroup = state.featureGroups.map((f) => {
        if (f.id === action.payload.featureGroup.id) {
          return { ...f, ...action.payload.featureGroup };
        }
        return f;
      });
      state.featureGroups = updatedFeaturesGroup;
    },
    addToFeatureGroup: (state, action: PayloadAction<any>) => {
      const currentState = current(state);
      const tempFeatureGroups = currentState.featureGroups;
      const tempFeatures = [...currentState.features];
      const fg = { ...tempFeatureGroups[action.payload.featureGroupIndex] };
      const f = tempFeatures.find((feature: Feature) => {
        return feature.id === action.payload.featureId;
      });

      fg.features = [...fg.features, ...[f as Feature]];
      state.featureGroups[action.payload.featureGroupIndex] = fg;
      tempFeatures.splice(tempFeatures.indexOf(f as Feature), 1);
      state.features = tempFeatures;
    },
  },
});

export const {
  setRepositoriesList,
  addFeature,
  addFeatureGroup,
  updateFeature,
  updateFeatureGroup,
  onProductSelect,
  onRepositorySelect,
  addToFeatureGroup,
} = featureRepositorySlice.actions;
