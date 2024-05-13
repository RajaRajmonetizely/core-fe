import { ReactComponent as AccountIcon } from '../../assets/icons/account.svg';
import { ReactComponent as ContractIcon } from '../../assets/icons/contractManager.svg';
import { ReactComponent as FeaturesIcon } from '../../assets/icons/features.svg';
import { ReactComponent as CalculatorIcon } from '../../assets/icons/priceCalculator.svg';
import { ReactComponent as PricebookIcon } from '../../assets/icons/pricebook.svg';

export const operationList = [
  {
    operationId: 1,
    operationName: 'Product',
    name: 'products',
    icon: <FeaturesIcon />,
    path: '/products',
  },
  {
    operationId: 2,
    operationName: 'Feature Repository',
    name: 'featureRepositories',
    icon: <ContractIcon />,
    path: '/feature-repository',
  },

  {
    operationId: 3,
    operationName: 'Plan',
    name: 'plans',
    icon: <CalculatorIcon />,
    path: '/plans',
  },
  {
    operationId: 4,
    operationName: 'Price Book',
    name: 'pricebook',
    icon: <PricebookIcon />,
    path: '/pricebook',
  },
  {
    operationId: 5,
    operationName: 'Price Book Rule',
    name: 'pricebookRule',
    icon: <CalculatorIcon />,
    path: '/pricebook-rule',
  },
  {
    operationId: 6,
    operationName: 'Price Book Discount',
    name: 'discountingPolicy',
    icon: <CalculatorIcon />,
    path: '/discounting-policy',
  },
  {
    operationId: 7,
    operationName: 'Pricing Calculator',
    name: 'pricingCalculator',
    icon: <CalculatorIcon />,
    path: '/pricing-calculator',
  },
  {
    operationId: 8,
    operationName: 'Deal Hub',
    name: 'dealHub',
    icon: <CalculatorIcon />,
    path: '/deal-hub',
  },

  {
    operationId: 9,
    operationName: 'Sync to Salesforce',
    name: 'salesForceIntegration',
    icon: <CalculatorIcon />,
    path: '/sales-force-integration',
  },
  {
    operationId: 10,
    operationName: 'Account',
    name: 'account',
    icon: <AccountIcon />,
    path: '/account',
  },
  {
    operationId: 11,
    operationName: 'Users',
    name: 'userManagement',
    icon: <ContractIcon />,
    path: '/user-management',
  },
  {
    operationId: 12,
    operationName: 'Organizational Hierarchy',
    name: 'companyHierarchy',
    icon: <ContractIcon />,
    path: '/company-hierarchy',
  },
  {
    operationId: 17,
    operationName: 'Template Management',
    name: 'templateManagement',
    icon: <ContractIcon />,
    path: '/template-management',
  },
  {
    operationId: 18,
    operationName: 'Deal Terms',
    name: 'dealTerms',
    icon: <ContractIcon />,
    path: '/deal-terms',
  },
];

export const subOperationsList: any = {
  Tenant: [
    {
      operationId: 13,
      operationName: 'Tenant',
      name: 'tenantUsageMonitor',
      icon: <ContractIcon />,
      path: '/tenant-monitor',
    },
    {
      operationId: 14,
      operationName: 'Tenant',
      name: 'tenantManagement',
      icon: <ContractIcon />,
      path: '/tenant-management',
    },
  ],
  Opportunity: [
    {
      operationId: 15,
      operationName: 'Opportunity',
      name: 'opportunity',
      icon: <ContractIcon />,
      path: '/opportunity',
    },
    {
      operationId: 16,
      operationName: 'Opportunity',
      name: 'opportunityStageAndType',
      icon: <ContractIcon />,
      path: '/opportunity-stage-type',
    },
  ],
};

export const dummyOperations = [
  {
    operationId: 19,
    operationName: 'Report',
    name: 'report',
    icon: <ContractIcon />,
    path: '/report',
  },
  {
    operationId: 20,
    operationName: 'Deal Desk Settings',
    name: 'dealDeskSettings',
    icon: <ContractIcon />,
    path: '/deal-desk-settings',
  },
];
