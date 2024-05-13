/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ICoreData,
  ICreateMetrics,
  ICreateMetricsSuccess,
  ICreatePricingModel,
  ICreatePricingModelSuccess,
  IGetMetrics,
  IGetPricingModel,
  IPricingStructure,
  IUpdateCoreData,
} from '../../models/pricing-model';
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  PRICING_STRUCTURE: `/api/v1/pricing/structure`,
  PRICING_CURVE: `/api/v1/pricing/model/curve`,
  PRICING_CURVE_CONFIG: (id: string) => `/api/v1/pricing/model/curve/${id}/config`,
  METRICS: `/api/v1/pricing/metrics`,
  PRICING_MODEL: `/api/v1/pricing/model`,
  DEAL_SIMULATION: `/api/v1/pricing/model/calculator`,
  PRICING_MODEL_ADDON: (id: string) => `/api/v1/pricing/model/${id}/addon`,
});

const getPricingStructure = async (): Promise<IPricingStructure> => {
  const response = await axiosInstance.get(`${PATHS.PRICING_STRUCTURE}`);
  return response.data;
};

const getPricingMetrics = async (): Promise<IGetMetrics> => {
  const response = await axiosInstance.get(`${PATHS.METRICS}`);
  return response.data;
};

const getPricingCurveConfig = async (modelId: string): Promise<IGetMetrics> => {
  const response = await axiosInstance.get(`${PATHS.PRICING_CURVE_CONFIG(modelId)}`);
  return response.data;
};

const createMetrics = async (data: ICreateMetrics): Promise<ICreateMetricsSuccess> => {
  const response = await axiosInstance.post(`${PATHS.METRICS}`, data);
  return response.data;
};

const createPricingModel = async (
  data: ICreatePricingModel,
  sourceId?: string,
): Promise<ICreatePricingModelSuccess> => {
  let url = PATHS.PRICING_MODEL;
  if (sourceId) {
    url += `?source=${sourceId}`;
  }
  const response = await axiosInstance.post(url, data);
  return response.data;
};

const getPricingModel = async (packageId: string): Promise<IGetPricingModel> => {
  const response = await axiosInstance.get(`${PATHS.PRICING_MODEL}?package_id=${packageId}`);
  return response.data;
};

const getDetailsByModelId = async (modelId: string): Promise<ICreatePricingModelSuccess> => {
  const response = await axiosInstance.get(`${PATHS.PRICING_MODEL}/${modelId}`);
  return response.data;
};

const updateModelData = async (modelId: string, data: ICoreData): Promise<IUpdateCoreData> => {
  const response = await axiosInstance.put(`${PATHS.PRICING_MODEL}/${modelId}`, data);
  return response.data;
};

const getAddOnsByModelId = async (modelId: string): Promise<any> => {
  const response = await axiosInstance.get(PATHS.PRICING_MODEL_ADDON(modelId));
  return response.data;
};

const getPricingCurve = async (modelId: string, data: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.PRICING_CURVE}/${modelId}`, data);
  return response.data;
};

const getSimulationData = async (modelId: string, data: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.DEAL_SIMULATION}/${modelId}`, data);
  return response.data;
};

export interface PricingModelAPIClient {
  readonly getPricingStructure: () => Promise<IPricingStructure>;
  readonly getPricingMetrics: () => Promise<IGetMetrics>;
  readonly createMetrics: (data: ICreateMetrics) => Promise<ICreateMetricsSuccess>;
  readonly createPricingModel: (
    data: ICreatePricingModel,
    id?: string,
  ) => Promise<ICreatePricingModelSuccess>;
  readonly getPricingModel: (packageId: string) => Promise<IGetPricingModel>;
  readonly getDetailsByModelId: (packageId: string) => Promise<ICreatePricingModelSuccess>;
  readonly updateModelData: (modelId: string, data: ICoreData) => Promise<IUpdateCoreData>;
  readonly getAddOnsByModelId: (modelId: string) => Promise<any>;
  readonly getPricingCurve: (modelId: string, data: any) => Promise<any>;
  readonly getSimulationData: (modelId: string, data: any) => Promise<any>;
  readonly getPricingCurveConfig: (modelId: string) => Promise<any>;
}

const PricingModelClient: PricingModelAPIClient = Object.freeze({
  getPricingStructure,
  getPricingMetrics,
  getPricingModel,
  createMetrics,
  createPricingModel,
  getDetailsByModelId,
  updateModelData,
  getAddOnsByModelId,
  getPricingCurve,
  getSimulationData,
  getPricingCurveConfig,
});

export default PricingModelClient;
