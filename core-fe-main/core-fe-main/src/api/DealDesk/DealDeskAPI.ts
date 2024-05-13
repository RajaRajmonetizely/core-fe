/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from 'lodash';
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  DEAL_DESK: `/api/v1/deal_desk`,
});

const getDeals = async (filters: any): Promise<any> => {
  const filterParams: any = [];
  _.keys(filters).forEach((k: string) => {
    if (filters[k]) filterParams.push(`${k}=${filters[k]}`);
  });
  const filterPath = filterParams.length
    ? `${PATHS.DEAL_DESK}?${filterParams.join('&')}`
    : `${PATHS.DEAL_DESK}`;

  const response = await axiosInstance.get(filterPath);
  return response.data;
};

export interface DealDeskAPIClient {
  readonly getDeals: (filters: any) => Promise<any>;
}

const DealDeskClient: DealDeskAPIClient = Object.freeze({
  getDeals,
});

export default DealDeskClient;
