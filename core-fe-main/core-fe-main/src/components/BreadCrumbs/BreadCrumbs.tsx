/* eslint-disable react/prop-types */
import { Box } from '@mui/material';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useBreadcrumbs, { BreadcrumbComponentType } from 'use-react-router-breadcrumbs';
import { UseAppDispatch } from '../../store';
import { setSection } from '../../store/user_sections/userSections.slice';

const PackageUserBreadcrumb: BreadcrumbComponentType<'packageId'> = ({ location }) => {
  const locationData: { state: { [key: string]: string } } = location as unknown as {
    state: { [key: string]: string };
  };
  if (locationData && locationData.state?.packageName) {
    return <div>{locationData.state.packageName}</div>;
  }
  return <div />;
};

const PricingModelUserBreadcrumb: BreadcrumbComponentType<'modelId'> = ({ location }) => {
  const locationData: { state: { [key: string]: string } } = location as unknown as {
    state: { [key: string]: string };
  };
  if (locationData && locationData.state?.modelName) {
    return <div>{locationData.state.modelName}</div>;
  }
  return <div />;
};

const CustomBreadcrumbs = () => {
  const opList = useSelector((state: any) => state.auth.opList);
  const dispatch = UseAppDispatch();
  const breadcrumbs = useBreadcrumbs([
    {
      path: '/plans/package-designer/:packageId',
      breadcrumb: PackageUserBreadcrumb,
    },
    {
      path: '/plans/pricing-model/:modelId',
      breadcrumb: PricingModelUserBreadcrumb,
    },
  ]);

  const homeRoute = () => {
    if (opList.length > 0) {
      return opList[0].path;
    }
    return '';
  };

  return (
    <Box sx={{ marginLeft: '10px', marginBottom: '10px' }}>
      <Breadcrumbs>
        {breadcrumbs.map(({ breadcrumb, match }) => (
          <Link
            key={match.pathname}
            style={{ color: 'rgba(0, 0, 0, 0.54)' }}
            onClick={() => {
              if (match.pathname === '/') {
                dispatch(
                  setSection({
                    id: opList[0].operationId,
                    operationName: opList[0].operationName,
                    name: opList[0].name,
                    route: opList[0].path,
                  }),
                );
              }
            }}
            to={match.pathname === '/' ? homeRoute() : match.pathname || ''}>
            {breadcrumb}
          </Link>
        ))}
      </Breadcrumbs>
    </Box>
  );
};

export default CustomBreadcrumbs;
