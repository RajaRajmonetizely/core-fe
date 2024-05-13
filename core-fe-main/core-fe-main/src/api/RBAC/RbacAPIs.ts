/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  RBAC_OPERATIONS: `/api/v1/rbac/operations`,
});

const getOperations = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.RBAC_OPERATIONS}`);
  return response.data;
};

export interface RbacAPIClient {
  readonly getOperations: () => Promise<any>;
}

const RbacClient: RbacAPIClient = Object.freeze({
  getOperations,
});

export default RbacClient;
