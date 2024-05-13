/* eslint-disable @typescript-eslint/no-unused-vars */
import { IAddPackage, ISuccessAddPackage, ISuccessGetPackagePerPlan } from '../../models/package';
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  PACKAGE: `/api/v1/package`,
});

const getPackagePerPlan = async (planId: string): Promise<ISuccessGetPackagePerPlan> => {
  const response = await axiosInstance.get(`${PATHS.PACKAGE}?plan_id=${planId}`);
  return response.data;
};

const getPackageById = async (packageId: string): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.PACKAGE}/${packageId}`);
  return response.data;
};

const addPackage = async (
  packageOb: IAddPackage,
  sourceId?: string,
): Promise<ISuccessAddPackage> => {
  let url = PATHS.PACKAGE;
  if (sourceId) {
    url += `?source=${sourceId}`;
  }
  const response = await axiosInstance.post(url, packageOb);
  return response.data;
};

const editPackage = async (pid: string, packageOb: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.PACKAGE}/${pid}`, packageOb);
  return response;
};

export interface PackageAPIClient {
  readonly getPackagePerPlan: (planId: any) => Promise<any>;
  readonly getPackageById: (packageId: any) => Promise<any>;
  readonly addPackage: (packageOb: IAddPackage, sourceId?: string) => Promise<any>;
  readonly editPackage: (pid: any, packageOb: any) => Promise<any>;
}

const PackageClient: PackageAPIClient = Object.freeze({
  getPackagePerPlan,
  getPackageById,
  addPackage,
  editPackage,
});

export default PackageClient;
