import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  ACCOUNT: `/api/v1/account`,
});

const getAccounts = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.ACCOUNT}`);
  return response.data;
};

const createAccount = async (account: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.ACCOUNT}`, account);
  return response.data;
};

const editAccount = async (acId: any, account: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.ACCOUNT}/${acId}`, account);
  return response.data;
};
export interface AccountAPIClient {
  readonly getAccounts: () => Promise<any>;
  readonly createAccount: (account: any) => Promise<any>;
  readonly editAccount: (acId: number, account: any) => Promise<any>;
}

const AccountClient: AccountAPIClient = Object.freeze({
  getAccounts,
  createAccount,
  editAccount,
});

export default AccountClient;
