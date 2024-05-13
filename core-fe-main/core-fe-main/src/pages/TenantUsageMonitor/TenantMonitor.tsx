import { Grid, Paper } from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import TenantsClient from '../../api/Tenant/TenantAPIs';
import { setRefetchData, setTenants } from '../../store/tenant/tenant.slice';
import ViewTenants from './ViewTenants';

interface IProps {
  intl?: any;
}

const TenantMonitor: React.FC<IProps> = (): ReactElement => {
  const dispatch = useDispatch();
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    getTenants();
    // eslint-disable-next-line
  }, []);

  const getTenants = () => {
    setIsDataLoading(true);
    TenantsClient.getTenantMonitor()
      .then((response: any) => {
        dispatch(setRefetchData(false));
        dispatch(setTenants(response.data));
        setIsDataLoading(false);
      })
      .catch((e) => {
        setIsDataLoading(false);
        console.error(e);
      });
  };

  return (
    <Grid container>
      <Grid item md={12}>
        <Paper
          sx={{
            padding: '18px 33px',
            marginRight: '20px',
          }}>
          <ViewTenants loader={isDataLoading} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default injectIntl(TenantMonitor);
