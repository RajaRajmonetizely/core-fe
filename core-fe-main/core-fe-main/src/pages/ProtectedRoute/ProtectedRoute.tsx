import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<any> = ({ children }: { children: JSX.Element }) => {
  const auth = useSelector((state: any) => state.auth.token);
  return auth.length ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
