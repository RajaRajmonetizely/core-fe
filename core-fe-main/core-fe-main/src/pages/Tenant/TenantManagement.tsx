import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { Box, Breadcrumbs, Grid, Paper } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import AddTenant from './AddTenant';
import ViewTenant from './ViewTenant';
import TenantsClient from '../../api/Tenant/TenantAPIs';
import {
  setRefetchData,
  setSelectedRow,
  setTenants,
  setTenantUsers,
} from '../../store/tenant/tenant.slice';
import { deleteUser } from '../../store/users/user.slice';

interface IProps {
  intl?: any;
}

const pageStyle = {
  link: {
    cursor: 'pointer',
    color: 'rgba(0, 0, 0, 0.54)',
    borderBottom: '1px solid',
  },
  breadCrumbs: {
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    marginTop: '20px',
  },
};

const TenantManagement: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const refetchData = useSelector((state: any) => state.tenants.refetchData);
  const selectedRow = useSelector((state: any) => state.tenants.selectedRow);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  useEffect(() => {
    getTenants();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData) {
      getTenants();
    }
    // eslint-disable-next-line
  }, [refetchData]);

  const getTenants = () => {
    if (ability.can('GET', 'Tenant')) {
      setIsDataLoading(true);
      TenantsClient.getTenants()
        .then((response: any) => {
          dispatch(setRefetchData(false));
          dispatch(setTenants(response.data));
          setIsDataLoading(false);
        })
        .catch((e) => {
          setIsDataLoading(false);
          console.error(e);
        });
    }
  };

  const onDeleteTenant = async (data: any) => {
    try {
      setIsDataLoading(true);
      await TenantsClient.deleteTenant(data.id);
      setSnackBarValues({
        display: true,
        type: 'success',
        message: intl.formatMessage({ id: 'tenantDeleted' }),
      });
      dispatch(deleteUser(data));
      setIsDataLoading(false);
    } catch (e) {
      setIsDataLoading(false);
    }
  };

  const getTenantUser = async (data: any) => {
    try {
      setIsDataLoading(true);
      const response = await TenantsClient.getTenantUsers(data.id);
      if (response.message === 'success') {
        dispatch(setTenantUsers(response.data));
      }
      setIsDataLoading(false);
    } catch (e) {
      setIsDataLoading(false);
    }
  };

  return (
    <Grid container>
      <Grid item md={12}>
        <Paper
          sx={{
            padding: '18px 33px',
            marginRight: '20px',
          }}>
          {selectedRow ? (
            <Breadcrumbs sx={pageStyle.breadCrumbs} aria-label="breadcrumb">
              <Box
                sx={pageStyle.link}
                onClick={() => {
                  dispatch(setSelectedRow(null));
                }}>
                {selectedRow.name}
              </Box>
              <Box sx={pageStyle.link}> {intl.formatMessage({ id: 'users' })}</Box>
            </Breadcrumbs>
          ) : (
            <Box
              sx={{
                textAlign: 'right',
              }}>
              {ability.can('POST', 'Tenant') ? <AddTenant /> : null}
            </Box>
          )}

          <br />
          <ViewTenant
            onRowClick={(data: any) => getTenantUser(data)}
            onDeleteTenant={onDeleteTenant}
            loader={isDataLoading}
          />
        </Paper>
      </Grid>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </Grid>
  );
};

export default injectIntl(TenantManagement);
