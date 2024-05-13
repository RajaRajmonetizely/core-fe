import { DataGrid } from '@mui/x-data-grid';
import React, { ReactElement, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';

import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setEditData, setEditMode, setSelectedRow } from '../../store/tenant/tenant.slice';
import commonStyle from '../../styles/commonStyle';
import { getColumns, getTenantUserColumns } from './TenantConstants';

const ViewTenant: React.FC<any> = ({ intl, loader, onRowClick }): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ability = useSelector((state: any) => state.auth.ability);
  const tenants = useSelector((state: any) => state.tenants.tenants);
  const tenantUsers = useSelector((state: any) => state.tenants.tenantUsers);
  const selectedRow = useSelector((state: any) => state.tenants.selectedRow);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  const onEditTenant = (data: any) => {
    if (ability.can('PUT', 'Tenant')) {
      const tenant = tenants.find((t: any) => t.id === data.id);
      dispatch(setEditData(tenant));
      dispatch(setEditMode(true));
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const setMimicUser = (data: any) => {
    localStorage.setItem('mimicUser', JSON.stringify(data));
    localStorage.removeItem('ActiveSection');
    navigate('/');
    window.location.reload();
  };

  const onTenantSelect = (row: any) => {
    if (!selectedRow) {
      onRowClick(row);
      dispatch(setSelectedRow(row));
    }
  };

  return (
    <>
      <br />
      <Box sx={{ height: '620px', width: '100%' }}>
        <DataGrid
          key={selectedRow?.id ? selectedRow?.id : 'tenant'}
          // eslint-disable-next-line
          rows={loader ? [] : selectedRow ? tenantUsers : tenants}
          columns={
            selectedRow
              ? getTenantUserColumns(intl, setMimicUser)
              : getColumns(intl, onEditTenant, onTenantSelect)
          }
          getRowHeight={() => 'auto'}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 20,
              },
            },
            sorting: {
              sortModel: [{ field: 'created_on', sort: 'desc' }],
            },
          }}
          getRowId={(row) => (selectedRow ? row?.user_id : row?.id)}
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
export default injectIntl(ViewTenant);
