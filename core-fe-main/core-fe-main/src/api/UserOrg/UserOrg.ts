/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  ORG_HIERARCHY: `/api/v1/user/org_hierarchy`,
  ORG_HIERARCHY_CSV: `/api/v1/user/org_hierarchy/csv`,
});

const getOrgHierarchyStructure = async (includeUsers?: boolean): Promise<any> => {
  let url = `${PATHS.ORG_HIERARCHY}/structure`;
  if (includeUsers) {
    url += '?include_users=true';
  }
  const response = await axiosInstance.get(url);
  return response.data;
};

const uploadOrgCSV = async (data: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.ORG_HIERARCHY_CSV}`, data);
  return response.data;
};

export interface OrgHierarchyAPIClient {
  readonly getOrgHierarchyStructure: (includeUsers?: boolean) => Promise<any>;
  readonly uploadOrgCSV: (data?: any) => Promise<any>;
}

const OrgHierarchyClient: OrgHierarchyAPIClient = Object.freeze({
  getOrgHierarchyStructure,
  uploadOrgCSV,
});

export default OrgHierarchyClient;
