import { Box, CircularProgress, Paper, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import UsersClient from '../../api/Users/UserAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import IOSSwitch from '../../components/Switch/Switch';
import { ISnackBar } from '../../models/common';
import { setProfileData } from '../../store/users/user.slice';
import commonStyle from '../../styles/commonStyle';

interface IProps {
  intl: any;
}

const pageStyle = {
  inputContainer: {
    padding: '22px',
  },
  cardTitle: {
    fontFamily: 'Helvetica',
    fontWeight: '700',
    fontSize: '1.4rem',
    marginBottom: '20px',
    color: 'rgba(59, 63, 77, 1)',
  },
  checkBox: {
    margin: '20px',
    color: '#5D5FEF',
    '&.Mui-checked': {
      color: '#5D5FEF',
    },
  },
  checkboxLabel: {
    fontFamily: 'Helvetica',
    color: '#3B3F4D',
    fontSize: '0.9rem',
    fontWeight: 400,
    marginTop: 'auto',
    marginBottom: 'auto',
    marginRight: '12px',
    fontStyle: 'normal',
  },
  loader: {
    color: '#865DDA',
  },
  loaderContainer: {
    textAlign: 'center',
    paddingTop: '50px',
    paddingBottom: '50px',
  },
};

const ProfileSettings: React.FC<IProps> = ({ intl }) => {
  const dispatch = useDispatch();
  const [loader, setLoader] = useState(false);
  const profileLoader = useSelector((state: any) => state.users.profileLoader);
  const profileData = useSelector((state: any) => state.users.profileData);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [isMimicUser, setMimicUser] = useState(false);

  useEffect(() => {
    const tempUser = localStorage.getItem('mimicUser');
    if (tempUser) {
      const mimicData = JSON.parse(tempUser);
      if (mimicData.email) {
        setMimicUser(true);
      }
    }
  }, []);

  const saveSettings = async (value: boolean) => {
    try {
      setLoader(true);
      const response = await UsersClient.saveProfileSettings({
        name: 'staff_access',
        value,
      });
      if (response.message) {
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'userSettingsUpdated' }),
        });
      }
      setLoader(false);
    } catch (e) {
      setLoader(false);
    }
  };

  return (
    <Box sx={commonStyle.bodyContainer}>
      <Paper sx={pageStyle.inputContainer}>
        <Box sx={pageStyle.cardTitle}>{intl.formatMessage({ id: 'profileSettings' })}</Box>

        {loader || profileLoader ? (
          <Box sx={pageStyle.loaderContainer}>
            <CircularProgress sx={pageStyle.loader} size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              width: '33%',
            }}>
            <TextField
              sx={{ mb: 4, mt: 2 }}
              label={intl.formatMessage({ id: 'name' })}
              value={profileData.name}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
            <TextField
              sx={{ mb: 4 }}
              label={intl.formatMessage({ id: 'email' })}
              value={profileData.email}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
            <TextField
              sx={{ mb: 4 }}
              label={intl.formatMessage({ id: 'manager' })}
              value={profileData.manager_name}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
            <TextField
              sx={{ mb: 4 }}
              label={intl.formatMessage({ id: 'tenant' })}
              value={profileData.tenant}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
            <TextField
              sx={{ mb: 1.5 }}
              label={intl.formatMessage({ id: 'orgHierarchy' })}
              value={profileData.org_hierarchy}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />

            <Box sx={commonStyle.displayFlex}>
              <Box sx={pageStyle.checkboxLabel}>{intl.formatMessage({ id: 'staffAccess' })}</Box>
              <IOSSwitch
                sx={{ m: 1 }}
                disabled={isMimicUser}
                checked={profileData?.is_staff_access}
                onChange={(event) => {
                  dispatch(
                    setProfileData({ ...profileData, is_staff_access: event.target.checked }),
                  );
                  saveSettings(event.target.checked);
                }}
              />
            </Box>
          </Box>
        )}
      </Paper>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </Box>
  );
};

export default injectIntl(ProfileSettings);
