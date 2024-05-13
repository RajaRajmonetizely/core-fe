import { Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { ReactElement, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import commonStyle from '../../styles/commonStyle';

const ViewTenants: React.FC<any> = ({ intl, loader }): ReactElement => {
  const tenants = useSelector((state: any) => state.tenants.tenants);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'tenantName' }),
      flex: 1,
    },
    {
      field: 'product',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'products' }),
      flex: 1,
    },
    {
      field: 'plan',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'plans' }),
      flex: 1,
    },
    {
      field: 'pricing_model',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'pricingModel' }),
      flex: 1,
    },
    {
      field: 'quote',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'quote' }),
      flex: 1,
    },
    {
      field: 'contract',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'contract' }),
      flex: 1,
    },
    {
      field: 'signed_contract',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'signedContracts' }),
      flex: 1,
    },
    {
      field: 'users',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'user' }),
      flex: 1,
    },
    {
      field: 'logins',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'login' }),
      flex: 1,
    },
  ];

  return (
    <>
      <br />
      <Box sx={{ height: '620px', width: '100%' }}>
        <DataGrid
          rows={loader ? [] : tenants}
          columns={columns}
          getRowHeight={() => 'auto'}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 20,
              },
            },
          }}
          loading={loader}
          sx={commonStyle.dateGridStyle}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          disableColumnMenu
        />
      </Box>
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
export default injectIntl(ViewTenants);
