import { Auth } from 'aws-amplify';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_SERVICE_HOST,
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  async (config: any) => {
    try {
      const newConfig = { ...config };
      const session = await Auth.currentSession();
      newConfig.headers = {
        Authorization: `Bearer ${session.getAccessToken().getJwtToken()}`,
      };
      const tempUser = localStorage.getItem('mimicUser');
      if (tempUser) {
        const mimicUserData = JSON.parse(tempUser);
        newConfig.headers['impersonation-user-email'] = mimicUserData.email;
      }

      return newConfig;
    } catch (e) {
      return Promise.reject(e);
    }
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

// // Add a response interceptor
// axiosInstance.interceptors.response.use(
//   (response: any) => {
//     // Any status code that lie within the range of 2xx cause this function to trigger
//     return response;
//   },
//   (error: any) => {
//     if (error?.response?.status === 401) {
//       localStorage.clear();
//     }
//     return Promise.reject(error);
//   },
// );

export default axiosInstance;
