/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  OPPORTUNITY: `/api/v1/opportunity`,
});

const getOpportunity = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.OPPORTUNITY}`);
  return response.data;
};

const getOpportunityStage = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.OPPORTUNITY}/stage`);
  return response.data;
};

const editOpportunityStage = async (stageId: any, stage: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.OPPORTUNITY}/stage/${stageId}`, stage);
  return response.data;
};

const addOpportunityStage = async (stage: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.OPPORTUNITY}/stage`, stage);
  return response.data;
};

const getOpportunityType = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.OPPORTUNITY}/type`);
  return response.data;
};

const editOpportunityType = async (typeId: any, type: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.OPPORTUNITY}/type/${typeId}`, type);
  return response.data;
};

const addOpportunityType = async (type: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.OPPORTUNITY}/type`, type);
  return response.data;
};

const createOpportunity = async (opportunity: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.OPPORTUNITY}`, opportunity);
  return response.data;
};

const editOpportunity = async (oppId: any, opportunity: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.OPPORTUNITY}/${oppId}`, opportunity);
  return response.data;
};

export interface OpportunityAPIClient {
  readonly getOpportunity: () => Promise<any>;
  readonly getOpportunityStage: () => Promise<any>;
  readonly getOpportunityType: () => Promise<any>;
  readonly createOpportunity: (opportunity: any) => Promise<any>;
  readonly editOpportunity: (oppId: any, opportunity: any) => Promise<any>;
  readonly editOpportunityStage: (stageId: any, stage: any) => Promise<any>;
  readonly editOpportunityType: (typeId: any, type: any) => Promise<any>;
  readonly addOpportunityType: (type: any) => Promise<any>;
  readonly addOpportunityStage: (stage: any) => Promise<any>;
}

const OpportunityClient: OpportunityAPIClient = Object.freeze({
  getOpportunity,
  getOpportunityStage,
  getOpportunityType,
  createOpportunity,
  editOpportunity,
  editOpportunityStage,
  editOpportunityType,
  addOpportunityStage,
  addOpportunityType,
});

export default OpportunityClient;
