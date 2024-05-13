import { v4 as uuidv4 } from 'uuid';
/* eslint-disable */
export const REACT_APP_COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN;
export const REACT_APP_COGNITO_REGION = process.env.REACT_APP_COGNITO_REGION;
export const REACT_APP_COGNITO_CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID;
export const REACT_APP_COGNITO_CALLBACK_URL = process.env.REACT_APP_COGNITO_CALLBACK_URL;
// export const COGNITO_LOGIN_URL = `https://${REACT_APP_COGNITO_DOMAIN}.auth.${REACT_APP_COGNITO_REGION}.amazoncognito.com/login?client_id=${REACT_APP_COGNITO_CLIENT_ID}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${REACT_APP_COGNITO_CALLBACK_URL}`;

export const USER_DATA_FILE_LINK =
  'https://upload-csv-formats.s3.amazonaws.com/user-data-updated+(1).csv';
export const ORG_HIERARCHY_FILE_LINK =
  'https://upload-csv-formats.s3.amazonaws.com/org-heirarchy-data-updated.csv';

  export const PRICING_GUIDAANCE='/files/Pricing_Guidance.xlsx';

export const finalOutputColumn = {
  formula: '',
  has_formula: true,
  is_input_column: false,
  is_metric_column: false,
  is_output_column: true,
  key: 'output',
  metric_id: null,
  columnType: 'output',
  name: 'Output',
  id: uuidv4(),
  sub_columns: [],
};

export const salesForceTabs = [
  { id: uuidv4(), name: 'home' },
  { id: uuidv4(), name: 'account' },
  { id: uuidv4(), name: 'opportunity' },
  { id: uuidv4(), name: 'contract' },
  { id: uuidv4(), name: 'quote' },
  { id: uuidv4(), name: 'user' },
  { id: uuidv4(), name: 'salesHierarchy' },
];

export enum QuoteStatus {
  DRAFT = 'draft',
  FORWARD_TO_DD = 'forwarded_to_deal_desk',
  APPROVED = 'approved',
  ESCALATE_FOR_APPROVAL = 'escalate_for_approval',
}

export enum UserRoles {
  DEAL_DESK = 'Deal Desk',
  PRODUCT_OWNER = 'Product Owner',
  AE = 'AE',
  ROOT_ADMIN = 'Root admin',
  QUOTE_APPROVAL = 'Quote Approval',
  IMPLEMENTATION_ANALYST = 'Implementation Analyst',
}

export const discountFields = ['discount', 'discounted_total_price', 'discounted_unit_price'];

export const pricingColumnFields = [
  'list_total_price',
  'list_unit_price',
  'discount',
  'discounted_total_price',
  'discounted_unit_price',
];

export const COLORS = [
  '#33bd41',
  '#c80e9a',
  '#cffb61',
  '#ffb13b',
  '#01eaa1',
  '#0165b4',
  '#c43e00',
  '#fc7fff',
  '#0e600b',
  '#ff7cd1',
  '#fbed94',
  '#ba0f63',
  '#01877f',
  '#ff7a4d',
  '#60c8ff',
  '#744805',
  '#e7c9ff',
  '#7fb394',
  '#b2657e',
  '#014ac6',
];

export const defaultDateFormat = "MM/DD/YYYY";
