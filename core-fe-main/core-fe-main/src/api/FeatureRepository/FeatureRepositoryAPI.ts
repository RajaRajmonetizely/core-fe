/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IAddRepository,
  ICreateRepository,
  IEditFeature,
  IEditFeatureGroup,
  IEditRepository,
  IFeature,
  IFeatureGroup,
  IMessage,
  IRepositoryDetails,
  ISuccessRepository,
} from '../../models/repository';
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  REPOSITORY: `/api/v1/repository`,
  FEATURE: `/api/v1/repository/feature`,
  FEATURE_GROUP: `/api/v1/repository/feature_group`,
});

const getFeatureRepository = async (productId?: string): Promise<ISuccessRepository> => {
  let url = PATHS.REPOSITORY;
  if (productId) {
    url += `?product_id=${productId}`;
  }
  const response = await axiosInstance.get(url);
  return response.data;
};

const addFeatureRepository = async (
  data: ICreateRepository,
  sourceId?: string,
): Promise<IAddRepository> => {
  let url = PATHS.REPOSITORY;
  if (sourceId) {
    url += `?source=${sourceId}`;
  }
  const response = await axiosInstance.post(url, data);
  return response.data;
};

const editFeatureRepository = async (id: string, data: IEditRepository): Promise<IMessage> => {
  const response = await axiosInstance.put(`${PATHS.REPOSITORY}/${id}`, data);
  return response.data;
};

const getRepositoryById = async (id: string): Promise<IRepositoryDetails> => {
  const response = await axiosInstance.get(`${PATHS.REPOSITORY}/${id}`);
  return response.data;
};

const editFeature = async (id: string, data: IFeature): Promise<IEditFeature> => {
  const response = await axiosInstance.patch(`${PATHS.FEATURE}/${id}`, data);
  return response.data;
};

const deleteFeature = async (id: string): Promise<IMessage> => {
  const response = await axiosInstance.delete(`${PATHS.FEATURE}/${id}`);
  return response.data;
};

const editFeatureGroup = async (id: string, data: IFeatureGroup): Promise<IEditFeatureGroup> => {
  const response = await axiosInstance.patch(`${PATHS.FEATURE_GROUP}/${id}`, data);
  return response.data;
};

const deleteFeatureGroup = async (id: string): Promise<IMessage> => {
  const response = await axiosInstance.delete(`${PATHS.FEATURE_GROUP}/${id}`);
  return response.data;
};

export interface FeatureRepositoryAPIClient {
  readonly getFeatureRepository: (productId?: string) => Promise<ISuccessRepository>;
  readonly addFeatureRepository: (
    data: ICreateRepository,
    sourceId?: string,
  ) => Promise<IAddRepository>;
  readonly editFeatureRepository: (id: string, data: IEditRepository) => Promise<IMessage>;
  readonly getRepositoryById: (id: string) => Promise<IRepositoryDetails>;
  readonly editFeature: (id: string, data: IFeature) => Promise<IEditFeature>;
  readonly deleteFeature: (id: string) => Promise<IMessage>;
  readonly editFeatureGroup: (id: string, data: IFeatureGroup) => Promise<IEditFeatureGroup>;
  readonly deleteFeatureGroup: (id: string) => Promise<IMessage>;
}

const FeatureRepositoryClient: FeatureRepositoryAPIClient = Object.freeze({
  getFeatureRepository,
  addFeatureRepository,
  editFeatureRepository,
  getRepositoryById,
  editFeature,
  deleteFeature,
  editFeatureGroup,
  deleteFeatureGroup,
});

export default FeatureRepositoryClient;
