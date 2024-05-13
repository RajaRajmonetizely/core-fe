import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { Box, Grid, Paper } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import AddUser from './AddUser';
import ViewUser from './ViewUser';
import UsersClient from '../../api/Users/UserAPIs';
import { deleteUser, setRefetchData, setUsers } from '../../store/users/user.slice';
import OrgHierarchyClient from '../../api/UserOrg/UserOrg';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';

interface IProps {
  intl?: any;
}

const UserManagement: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isHierarchyListLoading, setIsHierarchyListLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const refetchData = useSelector((state: any) => state.users.refetchData);
  const [hierarchyList, setHierarchyList] = useState<any>([]);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    getUsers();
    getHierarchy();
    getUserRoles();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData) {
      getUsers();
    }
    // eslint-disable-next-line
  }, [refetchData]);

  const getUsers = () => {
    if (ability.can('GET', 'Users')) {
      setIsDataLoading(true);
      UsersClient.getUsers()
        .then((response: any) => {
          dispatch(setRefetchData(false));
          dispatch(setUsers(response.data));
          setIsDataLoading(false);
        })
        .catch((e) => {
          setIsDataLoading(false);
          console.error(e);
        });
    }
  };

  const getHierarchy = async () => {
    try {
      setIsHierarchyListLoading(true);
      const resp = await OrgHierarchyClient.getOrgHierarchyStructure();
      if (resp.message === 'success' && resp.data.length) {
        setHierarchyList(resp.data);
      } else {
        console.error(resp);
      }
      setIsHierarchyListLoading(false);
    } catch (e) {
      setIsHierarchyListLoading(false);
    }
  };
  // eslint-disable-next-line
  const getUserRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await UsersClient.getRoles();
      if (response.data) {
        setUserRoles(response.data);
      }
      setLoadingRoles(false);
    } catch (e) {
      setLoadingRoles(false);
    }
  };

  const onDeleteUser = async (data: any) => {
    try {
      setIsDataLoading(true);
      await UsersClient.deleteUser(data.id);
      setSnackBarValues({
        display: true,
        type: 'success',
        message: intl.formatMessage({ id: 'userDeleted' }),
      });
      dispatch(deleteUser(data));
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
          <Box
            sx={{
              textAlign: 'right',
            }}>
            {ability.can('POST', 'Users') ? (
              <AddUser
                userRoles={userRoles}
                loadUser={getUsers}
                disabled={isDataLoading || isHierarchyListLoading || loadingRoles}
                hierarchyList={hierarchyList}
              />
            ) : null}
          </Box>
          <br />
          <ViewUser userRoles={userRoles} onDeleteUser={onDeleteUser} loader={isDataLoading} />
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

export default injectIntl(UserManagement);
