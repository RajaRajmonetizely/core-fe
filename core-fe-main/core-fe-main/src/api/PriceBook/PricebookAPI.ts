/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  PRICEBOOK: `/api/v1/pricebook`,
});

const getAllPriceBooks = async (): Promise<any> => {
  const response = await axiosInstance.get(PATHS.PRICEBOOK);
  return response.data;
};

const getPriceBooks = async (opportunityId?: string): Promise<any> => {
  let url = PATHS.PRICEBOOK;
  if (opportunityId) {
    url += `?opportunity_id=${opportunityId}`;
  }
  const response = await axiosInstance.get(url);
  return response.data;
};

const getPriceBookById = async (id: string): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.PRICEBOOK}/${id}/details`);
  return response.data;
};

const createPriceBook = async (priceBook: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.PRICEBOOK}`, priceBook);
  return response.data;
};

const editPriceBook = async (pid: string, pbObject: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.PRICEBOOK}/${pid}`, pbObject);
  return response.data;
};

const deletePriceBook = async (pid: any): Promise<any> => {
  const response = await axiosInstance.delete(`${PATHS.PRICEBOOK}/${pid}`);
  return response;
};

const getDiscountPolicy = async (pid: string): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.PRICEBOOK}/${pid}/discount_policy`);
  return response.data;
};

const updateDiscountingPolicy = async (pid: any, pbDiscountObject: any): Promise<any> => {
  const response = await axiosInstance.put(
    `${PATHS.PRICEBOOK}/${pid}/discount_policy`,
    pbDiscountObject,
  );
  return response.data;
};

export interface PriceBookAPIClient {
  readonly getAllPriceBooks: (opportunityId?: string) => Promise<any>;
  readonly getPriceBooks: (opportunityId?: string) => Promise<any>;
  readonly createPriceBook: (priceBook: any) => Promise<any>;
  readonly editPriceBook: (pid: any, pbObject: any) => Promise<any>;
  readonly deletePriceBook: (pid: any) => Promise<any>;
  readonly getPriceBookById: (id: string) => Promise<any>;
  readonly getDiscountPolicy: (pid: string) => Promise<any>;
  readonly updateDiscountingPolicy: (pid: any, pbDiscountObject: any) => Promise<any>;
}

const PriceBookClient: PriceBookAPIClient = Object.freeze({
  getAllPriceBooks,
  getPriceBooks,
  createPriceBook,
  editPriceBook,
  deletePriceBook,
  getPriceBookById,
  getDiscountPolicy,
  updateDiscountingPolicy,
});

export default PriceBookClient;
