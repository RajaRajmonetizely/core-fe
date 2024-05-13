enum Page {
  Home = 'Home',
  Login = 'Login',
  Products = 'Products',
  PackageDesigner = 'PackageDesigner',
  PackageDesignerById = 'PackageDesignerById',
  FeatureRepository = 'FeatureRepository',
  Plans = 'Plans',
  PricingModel = 'PricingModel',
  PricingModelById = 'PricingModelById',
  Pricebook = 'Pricebook',
  PricebookRule = 'PricebookRule',
  DiscountingPolicy = 'DiscountingPolicy',
  VerifyAccount = 'VerifyAccount',
  PricingCalculator = 'PricingCalculator',
  PricingCalculatorById = 'PricingCalculatorById',
  DealHub = 'DealHub',
  Account = 'Account',
  AddAcoount = 'AddAccount',
  EditAccount = 'EditAccount',
  Opportunity = 'Opportunity',
  AddOpportunity = 'AddOpportunity',
  EditOpportunity = 'EditOpportunity',
  SalesForceIntegration = 'SalesForceIntegration',
  TenantUsageMonitor = 'TenantUsageMonitor',
  OpportunityStageAndType = 'OpportunityStageAndType',
  UserManagement = 'UserManagement',
  TenantManagement = 'TenantManagement',
  CompanyHierarchy = 'CompanyHierarchy',
  ProfileSettings = 'ProfileSettings',
  ForgotPassword = 'ForgotPassword',
  TemplateManagement = 'TemplateManagement',
  DealTerms = 'DealTerms',
  Report = 'Report',
  DealDeskSettings = 'DealDeskSettings',
}

const ROUTES: Record<Page, string> = {
  Home: '/',
  Login: 'login',
  Products: 'products',
  PackageDesigner: 'package-designer',
  PackageDesignerById: 'package-designer/:packageId',
  FeatureRepository: 'feature-repository',
  Plans: 'plans',
  PricingModel: 'pricing-model',
  PricingModelById: 'pricing-model/:modelId',
  Pricebook: 'pricebook',
  PricebookRule: 'pricebook-rule',
  DiscountingPolicy: 'discounting-policy',
  VerifyAccount: 'verify-account',
  PricingCalculator: 'pricing-calculator',
  PricingCalculatorById: 'pricing-calculator/:quoteId',
  DealHub: 'deal-hub',
  Account: 'account',
  AddAccount: 'account/add',
  EditAccount: 'account/edit/:accountId',
  Opportunity: 'opportunity',
  AddOpportunity: 'opportunity/add',
  EditOpportunity: 'opportunity/edit/:opportunityId',
  SalesForceIntegration: 'sales-force-integration',
  TenantUsageMonitor: 'tenant-monitor',
  OpportunityStageAndType: 'opportunity-stage-type',
  UserManagement: 'user-management',
  TenantManagement: 'tenant-management',
  CompanyHierarchy: 'company-hierarchy',
  ProfileSettings: 'profile-settings',
  ForgotPassword: 'forgot-password',
  TemplateManagement: 'template-management',
  DealTerms: 'deal-terms',
  Report: 'report',
  DealDeskSettings: 'deal-desk-settings',
};

export default ROUTES;
