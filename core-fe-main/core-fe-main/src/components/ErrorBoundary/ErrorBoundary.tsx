import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { ISnackBar } from '../../models/common';
import Snackbar from '../Snackbar/Snackbar';

interface IProps {
  children: React.ReactElement;
}

const ErrorBoundary: React.FC<IProps> = ({ children }) => {
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  useEffect(() => {
    axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: any) => {
        if (error?.response?.status === 401) {
          localStorage.clear();
        }
        if (error?.response?.data?.message) {
          setSnackBarValues({
            display: true,
            type: 'error',
            message: error?.response?.data?.message,
          });
        } else {
          setSnackBarValues({
            display: true,
            type: 'error',
            message: `Something went wrong. Please try again later!`,
          });
        }
        return Promise.reject(error);
      },
    );
  }, []);

  return (
    <>
      {children}
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </>
  );
};
export default ErrorBoundary;
