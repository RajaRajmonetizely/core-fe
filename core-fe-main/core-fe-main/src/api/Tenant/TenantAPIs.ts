/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  TENANT: `/api/v1/tenant`,
  TENANT_USERS: (id: string) => `/api/v1/tenant/${id}/users`,
});

const getTenants = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.TENANT}`);
  return response.data;
};

const addTenant = async (data: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.TENANT}`, data);
  return response.data;
};

const updateTenant = async (tenantId: string, data: any): Promise<any> => {
  const response = await axiosInstance.patch(`${PATHS.TENANT}/${tenantId}`, data);
  return response.data;
};

const deleteTenant = async (tenantId: string): Promise<any> => {
  const response = await axiosInstance.delete(`${PATHS.TENANT}/${tenantId}`);
  return response.data;
};

const getTenantUsers = async (tenantId: string): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.TENANT_USERS(tenantId)}`);
  return response.data;
};

const getTenantMonitor = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.TENANT}/monitor`);
  return response.data;
};

const getDealTerms = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.TENANT}/deal_terms`);
  return response.data;
};

const addDealTerms = async (data: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.TENANT}/deal_terms`, data);
  return response.data;
};

export interface TenantAPIClient {
  readonly getTenants: () => Promise<any>;
  readonly addTenant: (data: any) => Promise<any>;
  readonly updateTenant: (userId: string, data: any) => Promise<any>;
  readonly deleteTenant: (userId: string) => Promise<any>;
  readonly getTenantUsers: (tenantId: string) => Promise<any>;
  readonly getTenantMonitor: () => Promise<any>;
  readonly getDealTerms: () => Promise<any>;
  readonly addDealTerms: (data: any) => Promise<any>;
}

const TenantsClient: TenantAPIClient = Object.freeze({
  getTenants,
  addTenant,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  getTenantMonitor,
  getDealTerms,
  addDealTerms,
});

export default TenantsClient;
