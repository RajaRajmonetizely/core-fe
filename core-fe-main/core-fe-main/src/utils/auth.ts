import { Auth } from 'aws-amplify';

export const checkUserLogin = () => {
  return Auth.currentAuthenticatedUser();
};

export const awsConfig = {
  region: process.env.REACT_APP_PROJECT_REGION,
  identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
  cognitoRegion: process.env.REACT_APP_COGNITO_REGION,
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOLS_ID,
  userPoolWebClientId: process.env.REACT_APP_COGNITO_WEB_CLIENT_ID,
  oauth: process.env.REACT_APP_COGNITO_OAUTH,
};

export const setUserAttributes = (userName: string, attr: Record<string, any>) => {
  const userInfo = {
    userName,
    attributes: attr,
  };
  localStorage.setItem('UserInfo', JSON.stringify(userInfo));
};

export const clearUserAttributes = () => localStorage.removeItem('UserInfo');

export const getUserAttributes = () => {
  return JSON.parse(localStorage.getItem('UserInfo') || '{}');
};
