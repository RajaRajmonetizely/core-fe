/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  PRICEBOOK_RULES: `/api/v1/pricebook/rule`,
  OPPORTUNITY: `/api/v1/opportunity/type`,
  USERS: `/api/v1/user/all/users`,
  DESIGNATIONS: '/api/v1/user/org_hierarchy/structure',
});

const getPriceBookRules = async (): Promise<any> => {
  const response = await axiosInstance.get(PATHS.PRICEBOOK_RULES);
  return response.data;
};

const createPriceBookRule = async (postOb: any): Promise<any> => {
  const response = await axiosInstance.post(PATHS.PRICEBOOK_RULES, postOb);
  return response.data;
};

const editPriceBookRule = async (pid: string, pbrObject: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.PRICEBOOK_RULES}/${pid}`, pbrObject);
  return response.data;
};

const deletePriceBookRule = async (pid: string): Promise<any> => {
  const response = await axiosInstance.delete(`${PATHS.PRICEBOOK_RULES}/${pid}`);
  return response.data;
};

const getDesignations = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.DESIGNATIONS}`);
  return response.data;
};

const getUsers = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.USERS}`);
  return response.data;
};

const getOpportunityTypes = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.OPPORTUNITY}`);
  return response.data;
};

export interface PriceBookRuleAPIClient {
  readonly getPriceBookRules: () => Promise<any>;
  readonly createPriceBookRule: (postOb: any) => Promise<any>;
  readonly editPriceBookRule: (pid: string, pbrObject: any) => Promise<any>;
  readonly deletePriceBookRule: (pid: string) => Promise<any>;
  readonly getDesignations: () => Promise<any>;
  readonly getOpportunityTypes: () => Promise<any>;
  readonly getUsers: () => Promise<any>;
}

const PriceBookRuleClient: PriceBookRuleAPIClient = Object.freeze({
  getPriceBookRules,
  createPriceBookRule,
  editPriceBookRule,
  getDesignations,
  getOpportunityTypes,
  getUsers,
  deletePriceBookRule,
});

export default PriceBookRuleClient;
