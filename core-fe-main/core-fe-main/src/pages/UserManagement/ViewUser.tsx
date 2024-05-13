import React, { ReactElement, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { injectIntl } from 'react-intl';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import commonStyle from '../../styles/commonStyle';
import { setEditData, setEditMode } from '../../store/users/user.slice';
import { getUserManagementColumns } from './UserConstants';

const ViewUser: React.FC<any> = ({ intl, loader, onDeleteUser, userRoles }): ReactElement => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const users = useSelector((state: any) => state.users.users);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  const onEditUser = (data: any) => {
    if (ability.can('PUT', 'Users')) {
      const filterData = users.find((user: any) => user.id === data.id);
      const userData = JSON.parse(JSON.stringify(filterData));
      if (userData && userData.user_role_mapping) {
        userData.user_roles = [];
        userRoles.map((item: any) => {
          if (userData.user_role_mapping.findIndex((map: any) => map.id === item.id) > -1) {
            userData.user_roles.push(item);
          }
          return null;
        });
      }
      dispatch(setEditData(userData));
      dispatch(setEditMode(true));
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const onDelete = (data: any) => {
    if (ability.can('DELETE', 'Users')) {
      onDeleteUser(data);
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  return (
    <>
      <br />
      <Box sx={{ height: '520px', width: '100%' }}>
        <DataGrid
          rows={loader ? [] : users}
          columns={getUserManagementColumns(intl, onEditUser, onDelete)}
          getRowHeight={() => 'auto'}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          loading={loader}
          sx={commonStyle.dateGridStyle}
          pageSizeOptions={[5]}
          disableColumnMenu
          disableRowSelectionOnClick
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
export default injectIntl(ViewUser);
