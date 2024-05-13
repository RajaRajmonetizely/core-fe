import { combineReducers } from '@reduxjs/toolkit';
import { accountSlice } from './account/account.slice';
import { authSlice } from './auth/auth.slice';
import { dealHubSlice } from './deal_hub/dealHub.slice';
import { editFeatureSlice } from './feature_repository/editFeature.slice';
import { editFeatureGroupSlice } from './feature_repository/editFeatureGroup.slice';
import { featureRepositorySlice } from './feature_repository/featureRepository.slice';
import { opportunitySlice } from './opportunity/opportunity.slice';
import { packageSlice } from './package/package.slice';
import { planSlice } from './plans/plans.slice';
import { priceBookSlice } from './price_book/pricebook.slice';
import { createPriceBookRulesSlice } from './price_book_rules/createPriceBookRules.slice';
import { priceBookRulesSlice } from './price_book_rules/pricebookRules.slice';
import { pricingCalculatorSlice } from './pricing_calculator/pricingCalculator.slice';
import { pricingModelSlice } from './pricing_model/pricingModel.slice';
import { productSlice } from './products/products.slice';
import { salesForceSlice } from './salesforce/salesforce.slice';
import { templateSlice } from './template/template.slice';
import { tenantSlice } from './tenant/tenant.slice';
import { userSectionSlice } from './user_sections/userSections.slice';
import { usersSlice } from './users/user.slice';

const combinedReducer = combineReducers({
  auth: authSlice.reducer,
  userSection: userSectionSlice.reducer,
  products: productSlice.reducer,
  featureRepository: featureRepositorySlice.reducer,
  editFeature: editFeatureSlice.reducer,
  editFeatureGroup: editFeatureGroupSlice.reducer,
  plans: planSlice.reducer,
  package: packageSlice.reducer,
  pricingModel: pricingModelSlice.reducer,
  priceBook: priceBookSlice.reducer,
  opportunity: opportunitySlice.reducer,
  pricingCalculator: pricingCalculatorSlice.reducer,
  priceBookRules: priceBookRulesSlice.reducer,
  createPriceBookRules: createPriceBookRulesSlice.reducer,
  account: accountSlice.reducer,
  salesForce: salesForceSlice.reducer,
  dealHub: dealHubSlice.reducer,
  users: usersSlice.reducer,
  tenants: tenantSlice.reducer,
  template: templateSlice.reducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logout') {
    state = undefined;
  }
  return combinedReducer(state, action);
};

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
