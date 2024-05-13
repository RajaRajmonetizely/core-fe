/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  ALL_USERS: `/api/v1/user/all/users`,
  USER: `/api/v1/user`,
  USER_CSV: '/api/v1/user/csv',
  USER_ROLE: `/api/v1/user/role`,
  PROFILE_SETTINGS: `/api/v1/user/setting`,
  USER_PROFILE: `/api/v1/user/profile`,
});

const getUsers = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.ALL_USERS}`);
  return response.data;
};

const addUser = async (data: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.USER}`, data);
  return response.data;
};

const updateUser = async (userId: string, data: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.USER}/${userId}`, data);
  return response.data;
};

const deleteUser = async (userId: string): Promise<any> => {
  const response = await axiosInstance.delete(`${PATHS.USER}/${userId}`);
  return response.data;
};

const uploadUsersCSV = async (data: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.USER_CSV}`, data);
  return response.data;
};

const getRoles = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.USER_ROLE}`);
  return response.data;
};

const saveProfileSettings = async (data: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.PROFILE_SETTINGS}`, data);
  return response.data;
};

const getUserProfile = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.USER_PROFILE}`);
  return response.data;
};

export interface UsersAPIClient {
  readonly getUsers: () => Promise<any>;
  readonly addUser: (data: any) => Promise<any>;
  readonly updateUser: (userId: string, data: any) => Promise<any>;
  readonly deleteUser: (userId: string) => Promise<any>;
  readonly uploadUsersCSV: (userData: any) => Promise<any>;
  readonly getRoles: () => Promise<any>;
  readonly saveProfileSettings: (data: any) => Promise<any>;
  readonly getUserProfile: () => Promise<any>;
}

const UsersClient: UsersAPIClient = Object.freeze({
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  uploadUsersCSV,
  getRoles,
  saveProfileSettings,
  getUserProfile,
});

export default UsersClient;
