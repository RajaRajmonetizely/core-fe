/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  SALES_FORCE_CONNECTOR: `/api/v1/salesforce/connector`,
  SALES_FORCE_MAPPING: `api/v1/salesforce/mapping`,
  SALES_FORCE_SYNC: `/api/v1/salesforce/sync`,
  SALES_FORCE_USER_ROLE: `api/v1/salesforce/user_role`,
});

const saveSalesForceConfig = async (data: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.SALES_FORCE_CONNECTOR}`, data);
  return response.data;
};

const getSalesforceSettings = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.SALES_FORCE_CONNECTOR}`);
  return response.data;
};

const getSalesforceMappingObjectList = async (object: any): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.SALES_FORCE_MAPPING}/objects?${object}`);
  return response.data;
};

const syncSalesForceData = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.SALES_FORCE_SYNC}`);
  return response.data;
};

const getSalesforceMapping = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.SALES_FORCE_MAPPING}`);
  return response.data;
};

const saveSalesforceMappingObject = async (postOb: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.SALES_FORCE_MAPPING}`, postOb);
  return response.data;
};

const updateSalesforceMappingObject = async (id: string, postOb: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.SALES_FORCE_MAPPING}/${id}`, postOb);
  return response.data;
};

const getSalesforceRoles = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.SALES_FORCE_USER_ROLE}`);
  return response.data;
};

export interface SalesForceAPIClient {
  readonly saveSalesForceConfig: (data: any) => Promise<any>;
  readonly getSalesforceSettings: () => Promise<any>;
  readonly getSalesforceMappingObjectList: (object: any) => Promise<any>;
  readonly syncSalesForceData: () => Promise<any>;
  readonly getSalesforceMapping: () => Promise<any>;
  readonly saveSalesforceMappingObject: (postOb: any) => Promise<any>;
  readonly updateSalesforceMappingObject: (id: string, postOb: any) => Promise<any>;
  readonly getSalesforceRoles: () => Promise<any>;
}

const SalesForceClient: SalesForceAPIClient = Object.freeze({
  saveSalesForceConfig,
  getSalesforceSettings,
  getSalesforceMappingObjectList,
  syncSalesForceData,
  getSalesforceMapping,
  saveSalesforceMappingObject,
  updateSalesforceMappingObject,
  getSalesforceRoles,
});

export default SalesForceClient;
