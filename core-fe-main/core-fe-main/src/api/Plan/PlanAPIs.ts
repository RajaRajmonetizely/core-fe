/* eslint-disable @typescript-eslint/no-unused-vars */
import { IAddPlan, IAddTier, IAllPlans, IDeleteTier, IUpdateTier } from '../../models/plan';
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  PLANS: `/api/v1/plan`,
  TIERS: `/api/v1/plan/tier/`,
});

const getPlans = async (): Promise<IAllPlans> => {
  const response = await axiosInstance.get(`${PATHS.PLANS}`);
  return response.data;
};

const getPlansByRepositoryId = async (repositoryId: string): Promise<IAllPlans> => {
  const response = await axiosInstance.get(`${PATHS.PLANS}?repository_id=${repositoryId}`);
  return response.data;
};

const addPlan = async (plan: IAddPlan): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.PLANS}`, plan);
  return response.data;
};

const addTiersForPlan = async (tiersOb: IAddTier): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.TIERS}`, tiersOb);
  return response.data;
};

const editTier = async (pid: string, tier: IUpdateTier): Promise<any> => {
  const response = await axiosInstance.patch(`${PATHS.PLANS}/${pid}/tiers`, tier);
  return response;
};

const deleteTier = async (pid: string, tier: IDeleteTier): Promise<any> => {
  const response = await axiosInstance.delete(`${PATHS.PLANS}/${pid}/tiers`, { data: tier });
  return response;
};

export interface PlanAPIClient {
  readonly getPlansByRepositoryId: (repositoryId: any) => Promise<any>;
  readonly getPlans: () => Promise<any>;
  readonly addPlan: (plan: IAddPlan) => Promise<any>;
  readonly addTiersForPlan: (tiersOb: IAddTier) => Promise<any>;
  readonly editTier: (pid: any, tier: any) => Promise<any>;
  readonly deleteTier: (pid: any, tier: any) => Promise<any>;
}

const PlanClient: PlanAPIClient = Object.freeze({
  getPlans,
  getPlansByRepositoryId,
  addPlan,
  addTiersForPlan,
  editTier,
  deleteTier,
});

export default PlanClient;
