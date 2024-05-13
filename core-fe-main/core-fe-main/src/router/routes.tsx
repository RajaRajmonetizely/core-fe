import { Box, CircularProgress } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import RbacClient from '../api/RBAC/RbacAPIs';
import UsersClient from '../api/Users/UserAPIs';
import SideBar from '../components/SideBar';
import Account from '../pages/Account/Account';
import AddAccount from '../pages/Account/AddAccount';
import CompanyHierarchy from '../pages/CompanyHierarchy';
import DealHub from '../pages/DealHub/DealHub';
import DiscountingPolicy from '../pages/DiscountingPolicy/DiscountingPolicy';
import DealTerms from '../pages/DynamicForm/DealTerms';
import FeatureRepository from '../pages/FeatureRepository';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import Login from '../pages/Login/Login';
import NotFoundPage from '../pages/Login/NotFoundPage';
import AddOpportunity from '../pages/Opportunity/AddOpportunity';
import Opportunity from '../pages/Opportunity/Opportunity';
import OpportunityStageAndType from '../pages/OpportunityStageAndType/OpportunityStageAndType';
import PackageDesigner from '../pages/Packages/PackageDesigner';
import Plans from '../pages/Plans/Plans';
import Pricebook from '../pages/Pricebook/Pricebook';
import PricebookRule from '../pages/PricebookRule';
import PricingCalculator from '../pages/PricingCalculator/PricingCalculator';
import PricingModel from '../pages/PricingModel/PricingModel';
import Products from '../pages/Products/Products';
import ProfileSettings from '../pages/ProfileSettings';
import ReportPage from '../pages/ReportPage/ReportPage';
import SalesForceIntegration from '../pages/SalesForceIntegration';
import Templates from '../pages/Templates/Templates';
import TenantManagement from '../pages/Tenant/TenantManagement';
import TenantMonitor from '../pages/TenantUsageMonitor/TenantMonitor';
import UserManagement from '../pages/UserManagement/UserManagement';
import VerifyAccount from '../pages/VerifyAccount';
import Settings from '../pages/Settings/Settings';
import { addUser, setAbility, setOperations } from '../store/auth/auth.slice';
import { setProfileData, setProfileLoader } from '../store/users/user.slice';
import { getUserAttributes } from '../utils/auth';
import ROUTES from './types';

const routeStyles = {
  centerContain: {
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularStyle: {
    height: '60px',
    width: '60px',
  },
};

const AppRoutes = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userName = useSelector((state: any) => state.auth.userName);
  const userOperations = useSelector((state: any) => state.auth.userOperations);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoggedIn(false);
    // eslint-disable-next-line
  }, []);

  const getOperations = () => {
    RbacClient.getOperations()
      .then((data) => {
        dispatch(setOperations(data));
        dispatch(setAbility());
      })
      .catch((e) => console.error(e));
  };

  const getProfileSettings = async () => {
    try {
      dispatch(setProfileLoader(true));
      const response = await UsersClient.getUserProfile();
      if (response.message === 'success') {
        dispatch(setProfileData(response.data));
      }
      dispatch(setProfileLoader(false));
    } catch (e) {
      dispatch(setProfileLoader(false));
    }
  };

  useEffect(() => {
    const userLoggedInToken = getUserAttributes();
    if (!_.isEmpty(userLoggedInToken)) {
      if (userName) {
        getOperations();
        getProfileSettings();
      }
      dispatch(addUser(userLoggedInToken));
      setIsLoggedIn(true);
    } else if (location.pathname === '/verify-account') {
      navigate('/verify-account');
    } else {
      setIsLoggedIn(false);
      navigate('/login');
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, dispatch]);

  const isValidRoute = (route: string) => {
    return _.keys(userOperations).includes(route);
  };

  if (isLoading) {
    return null;
  }

  if (isLoggedIn && Object.keys(userOperations).length === 0) {
    return (
      <Box sx={routeStyles.centerContain}>
        <CircularProgress sx={routeStyles.circularStyle} />
      </Box>
    );
  }

  return (
    <Routes>
      {isLoggedIn ? (
        <Route path="/" element={<SideBar />}>
          {isValidRoute('Product') ? <Route path={ROUTES.Products} element={<Products />} /> : null}
          {isValidRoute('Feature Repository') ? (
            <Route path={ROUTES.FeatureRepository} element={<FeatureRepository />} />
          ) : null}
          {isValidRoute('Plan') ? (
            <Route path={ROUTES.Plans} element={<Outlet />}>
              <Route index element={<Plans />} />
              {isValidRoute('Package') ? (
                <Route
                  path={ROUTES.PackageDesigner}
                  element={<Navigate to={`/${ROUTES.Plans}`} />}
                />
              ) : null}
              {isValidRoute('Package') ? (
                <Route path={ROUTES.PackageDesignerById} element={<PackageDesigner />} />
              ) : null}
              {isValidRoute('Pricing Model') ? (
                <Route path={ROUTES.PricingModel} element={<Navigate to={`/${ROUTES.Plans}`} />} />
              ) : null}
              {isValidRoute('Pricing Model') ? (
                <Route path={ROUTES.PricingModelById} element={<PricingModel />} />
              ) : null}
            </Route>
          ) : null}
          {isValidRoute('Price Book') ? (
            <Route path={ROUTES.Pricebook} element={<Pricebook />} />
          ) : null}
          {isValidRoute('Price Book Rule') ? (
            <Route path={ROUTES.PricebookRule} element={<PricebookRule />} />
          ) : null}
          {isValidRoute('Price Book Discount') ? (
            <Route path={ROUTES.DiscountingPolicy} element={<DiscountingPolicy />} />
          ) : null}
          {isValidRoute('Pricing Calculator') ? (
            <Route path={ROUTES.PricingCalculator} element={<PricingCalculator />} />
          ) : null}
          {isValidRoute('Pricing Calculator') ? (
            <Route path={ROUTES.PricingCalculatorById} element={<PricingCalculator />} />
          ) : null}
          {isValidRoute('Deal Hub') ? <Route path={ROUTES.DealHub} element={<DealHub />} /> : null}
          {isValidRoute('Deal Hub') ? (
            <Route path={ROUTES.DealDeskSettings} element={<Settings />} />
          ) : null}
          {isValidRoute('Sync to Salesforce') ? (
            <Route path={ROUTES.SalesForceIntegration} element={<SalesForceIntegration />} />
          ) : null}
          {isValidRoute('Account') ? <Route path={ROUTES.Account} element={<Account />} /> : null}
          {isValidRoute('Account') ? (
            <Route path={ROUTES.AddAccount} element={<AddAccount />} />
          ) : null}
          {isValidRoute('Account') ? (
            <Route path={ROUTES.EditAccount} element={<AddAccount />} />
          ) : null}
          {isValidRoute('Opportunity') ? (
            <Route path={ROUTES.Opportunity} element={<Opportunity />} />
          ) : null}
          {isValidRoute('Opportunity') ? (
            <Route path={ROUTES.AddOpportunity} element={<AddOpportunity />} />
          ) : null}
          {isValidRoute('Opportunity') ? (
            <Route path={ROUTES.EditOpportunity} element={<AddOpportunity />} />
          ) : null}
          {isValidRoute('Tenant') ? (
            <Route path={ROUTES.TenantUsageMonitor} element={<TenantMonitor />} />
          ) : null}
          {isValidRoute('Opportunity') ? (
            <Route path={ROUTES.OpportunityStageAndType} element={<OpportunityStageAndType />} />
          ) : null}
          {isValidRoute('Users') ? (
            <Route path={ROUTES.UserManagement} element={<UserManagement />} />
          ) : null}
          {isValidRoute('Tenant') ? (
            <Route path={ROUTES.TenantManagement} element={<TenantManagement />} />
          ) : null}
          {isValidRoute('Organizational Hierarchy') ? (
            <Route path={ROUTES.CompanyHierarchy} element={<CompanyHierarchy />} />
          ) : null}
          {isValidRoute('Template Management') ? (
            <Route path={ROUTES.TemplateManagement} element={<Templates />} />
          ) : null}
          {isValidRoute('Deal Terms') ? (
            <Route path={ROUTES.DealTerms} element={<DealTerms />} />
          ) : null}
          <Route path={ROUTES.Report} element={<ReportPage />} />
          <Route path={ROUTES.ProfileSettings} element={<ProfileSettings />} />
        </Route>
      ) : (
        <Route path={ROUTES.Login} element={<Login />} />
      )}
      <Route path={ROUTES.VerifyAccount} element={<VerifyAccount />} />
      <Route path={ROUTES.ForgotPassword} element={<ForgotPassword />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
