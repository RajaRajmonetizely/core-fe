/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  QUOTE: `/api/v1/quote`,
  MODEL_DETAILS: (productId: string, tierId: string) =>
    `/api/v1/pricing/model/${productId}/tier/${tierId}`,
  PRICE_BOOK_DISCOUNT: (priceBookId: string) => `/api/v1/pricebook/${priceBookId}/discount`,
  QUOTE_COMMENTS: (quoteId: string) => `/api/v1/quote/${quoteId}/comments`,
  FORWARD_QUOTE: (quoteId: string) => `/api/v1/quote/${quoteId}/forward`,
  ESCALATE_FOR_APPROVAL: (quoteId: string) => `/api/v1/quote/${quoteId}/approval`,
  SELF_APPROVAL: (quoteId: string, status: string) => `/api/v1/quote/${quoteId}/status`,
  RESEND_TO_AE: (quoteId: string) => `/api/v1/quote/${quoteId}/resend`,
});

const getModelDetails = async (productId: string, tierId: string): Promise<any> => {
  const response = await axiosInstance.get(PATHS.MODEL_DETAILS(productId, tierId));
  return response.data;
};

const getQuotes = async (priceBookId: any): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.QUOTE}?price_book_id=${priceBookId}`);
  return response.data;
};

const saveQuote = async (data: any, quoteId?: string): Promise<any> => {
  let url = `${PATHS.QUOTE}`;
  if (quoteId) {
    url += `?id=${quoteId}`;
  }
  const response = await axiosInstance.put(url, data);
  return response.data;
};

const cloneQuote = async (data: any, quoteId?: string): Promise<any> => {
  let url = `${PATHS.QUOTE}`;
  if (quoteId) {
    url += `?source=${quoteId}`;
  }
  const response = await axiosInstance.put(url, data);
  return response.data;
};

const getPriceBookDiscount = async (priceBookId: string): Promise<any> => {
  const response = await axiosInstance.get(PATHS.PRICE_BOOK_DISCOUNT(priceBookId));
  return response.data;
};

const pricingModelCalculation = async (
  productId: string,
  tierId: string,
  data: any,
): Promise<any> => {
  const response = await axiosInstance.put(PATHS.MODEL_DETAILS(productId, tierId), data);
  return response.data;
};

const getCommentByQuote = async (quoteId: string): Promise<any> => {
  const response = await axiosInstance.get(PATHS.QUOTE_COMMENTS(quoteId));
  return response.data;
};

const addComment = async (quoteId: string, data: any): Promise<any> => {
  const response = await axiosInstance.post(PATHS.QUOTE_COMMENTS(quoteId), data);
  return response.data;
};

const forwardToDealDesk = async (quoteId: string): Promise<any> => {
  const response = await axiosInstance.put(PATHS.FORWARD_QUOTE(quoteId), {});
  return response.data;
};

const escalateForApproval = async (quoteId: string, data: any): Promise<any> => {
  const response = await axiosInstance.put(PATHS.ESCALATE_FOR_APPROVAL(quoteId), data);
  return response.data;
};

const selfApproval = async (quoteId: string, status: string): Promise<any> => {
  const response = await axiosInstance.put(
    `${PATHS.SELF_APPROVAL(quoteId, status)}?status=${status}`,
    {},
  );
  return response.data;
};

const resendToAe = async (quoteId: string): Promise<any> => {
  const response = await axiosInstance.put(PATHS.RESEND_TO_AE(quoteId));
  return response.data;
};

const getQuoteDataById = async (quoteId: any): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.QUOTE}/${quoteId}`);
  return response.data;
};

export interface PricingCalculatorAPIClient {
  readonly getModelDetails: (productId: string, tierId: string) => Promise<any>;
  readonly getQuotes: (priceBookId: any) => Promise<any>;
  readonly pricingModelCalculation: (productId: string, tierId: string, data: any) => Promise<any>;
  readonly getPriceBookDiscount: (priceBookId: any) => Promise<any>;
  readonly saveQuote: (data: any, quoteId?: string) => Promise<any>;
  readonly cloneQuote: (data: any, quoteId?: string) => Promise<any>;
  readonly getQuoteDataById: (quoteId: any) => Promise<any>;
  readonly addComment: (quoteId: string, data: any) => Promise<any>;
  readonly forwardToDealDesk: (quoteId: string) => Promise<any>;
  readonly escalateForApproval: (quoteId: string, data: any) => Promise<any>;
  readonly selfApproval: (quoteId: string, status: string) => Promise<any>;
  readonly resendToAe: (quoteId: string) => Promise<any>;
  readonly getCommentByQuote: (quoteId: string) => Promise<any>;
}

const PricingCalculatorClient: PricingCalculatorAPIClient = Object.freeze({
  getModelDetails,
  getQuotes,
  pricingModelCalculation,
  getPriceBookDiscount,
  saveQuote,
  cloneQuote,
  getQuoteDataById,
  addComment,
  forwardToDealDesk,
  escalateForApproval,
  resendToAe,
  getCommentByQuote,
  selfApproval,
});

export default PricingCalculatorClient;
