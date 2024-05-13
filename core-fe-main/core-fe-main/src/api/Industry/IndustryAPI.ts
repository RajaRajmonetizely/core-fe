import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  INDUSTRY: `/api/v1/industry_type`,
});

const getIndustry = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.INDUSTRY}`);
  return response.data;
};

export interface IndustryAPIClient {
  readonly getIndustry: () => Promise<any>;
}

const IndustryClient: IndustryAPIClient = Object.freeze({
  getIndustry,
});

export default IndustryClient;
