import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import UsersClient from '../../api/Users/UserAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import { USER_DATA_FILE_LINK } from '../../constants/constants';
import { ISnackBar } from '../../models/common';
import { setEditData, setEditMode, setRefetchData } from '../../store/users/user.slice';
import styles from '../../styles/styles';
import { userSchema } from './UserConstants';

const componentStyles = {
  importUsersBtn: {
    marginLeft: '12px',
  },
  exportUsersBtn: {
    marginLeft: '12px',
    borderRadius: '4px',
  },
  inputSpacing: {
    marginTop: '10px',
    marginBottom: '19px',
  },
  checkboxLabel: {
    color: 'rgba(59, 63, 77, 0.5)',
    fontFamily: 'Helvetica',
    fontWeight: '700',
  },
  centerFormGroup: (marginTop: number) => {
    return { marginTop: `${marginTop}px` };
  },
  checkBoxPadding: {
    paddingTop: '0px',
    paddingBottom: '0px',
  },
  hideFileInput: {
    display: 'none',
  },
  addUserBtn: {
    minWidth: '100px',
  },
  addUserLoader: {
    color: 'white',
  },
  flexContainer: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};

const AddUser: React.FC<any> = ({
  intl,
  hierarchyList,
  userRoles,
  loadUser,
  disabled,
}): ReactElement => {
  const dispatch = useDispatch();
  const inputRef = useRef<any>(null);
  const [isOppDialogOpen, setUsersDialogOpen] = useState<boolean>(false);
  const isEditMode = useSelector((state: any) => state.users.isEditMode);
  const editData = useSelector((state: any) => state.users.editUserData);
  const users = useSelector((state: any) => state.users.users);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setUsersDialogOpen(true);
    }
  }, [isEditMode]);

  const openUserDialog = () => {
    setUsersDialogOpen(true);
  };

  const handleImportClick = () => {
    if (inputRef) {
      // 👇️ open file input box on click of another element
      inputRef?.current?.click();
    }
  };

  const handleExportClick = () => {
    try {
      const tempLink = document.createElement('a');
      tempLink.href = USER_DATA_FILE_LINK;
      tempLink.click();
    } catch (error) {
      console.error(error);
    }
  };

  const closeUserDialog = () => {
    dispatch(setEditMode(false));
    dispatch(setEditData({}));
    setUsersDialogOpen(false);
  };

  const submit = async (values: any) => {
    try {
      const body = { ...values };
      if (values.user_roles) {
        body.user_roles = values.user_roles.map((item: any) => item.id);
      }
      setIsSaving(true);
      if (isEditMode) {
        if (body.manager_id_ext_key === '') {
          body.manager_id_ext_key = null;
        }
        const response = await UsersClient.updateUser(values.id, body);
        if (response.data) {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'userUpdated' }),
            type: 'success',
          });
          dispatch(setRefetchData(true));
          dispatch(setEditMode(false));
          dispatch(setEditData({}));
          setIsSaving(false);
          setUsersDialogOpen(false);
        }
      } else {
        const response = await UsersClient.addUser(body);
        if (response.data) {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'userCreated' }),
            type: 'success',
          });
          dispatch(setRefetchData(true));
          setIsSaving(false);
          setUsersDialogOpen(false);
        }
      }
    } catch (e) {
      setIsSaving(false);
      console.error(e);
    }
  };

  const handleFileChange = async (event: any) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }
    event.target.value = null;
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', fileObj);
      const response = await UsersClient.uploadUsersCSV(formData);
      if (response.message === 'success') {
        loadUser();
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'userUploaded' }),
        });
      }
      setIsUploading(false);
    } catch (e) {
      setIsUploading(false);
    }

    // 👇️ reset file input
  };

  const checkBoxComponent = (
    values: any,
    field: string,
    label: string,
    setFieldValue: any,
    setFieldTouched: any,
  ) => {
    return (
      <FormGroup>
        <FormControlLabel
          sx={componentStyles.centerFormGroup(0)}
          control={
            <Checkbox
              checked={values[field] ?? false}
              sx={componentStyles.checkBoxPadding}
              onChange={(event) => {
                setFieldValue(field, event.target.checked);
                if (field === 'is_monetizely_user' && !event.target.checked)
                  setFieldValue('user_roles', []);
                setTimeout(() => setFieldTouched(field, true));
              }}
            />
          }
          label={
            <Box sx={componentStyles.checkboxLabel}>
              <FormattedMessage id={label} />
            </Box>
          }
        />
      </FormGroup>
    );
  };

  return (
    <>
      <Button
        disabled={disabled}
        sx={[styles.dialogButton, componentStyles.addUserBtn]}
        onClick={() => {
          openUserDialog();
        }}>
        {disabled ? (
          <CircularProgress sx={componentStyles.addUserLoader} size={24} />
        ) : (
          <FormattedMessage id="addUser" />
        )}
      </Button>
      <input
        onChange={handleFileChange}
        style={componentStyles.hideFileInput}
        type="file"
        ref={inputRef}
        accept=".csv"
      />
      <Button
        onClick={handleImportClick}
        disabled={isUploading || disabled}
        sx={{ ...styles.dialogButton, ...componentStyles.exportUsersBtn }}>
        {isUploading ? (
          <CircularProgress color="inherit" size={24} />
        ) : (
          <FormattedMessage id="importUsers" />
        )}
      </Button>
      <Tooltip title={<FormattedMessage id="exportUsersFormat" />}>
        <IconButton
          onClick={handleExportClick}
          disabled={isUploading || disabled}
          sx={{ ...styles.dialogButton, ...componentStyles.exportUsersBtn }}>
          <DownloadIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={isOppDialogOpen} fullWidth maxWidth="sm">
        <DialogTitle className="fieldHeader">
          {isEditMode ? <FormattedMessage id="editUser" /> : <FormattedMessage id="addUser" />}
        </DialogTitle>
        <DialogContent dividers>
          <Formik
            onSubmit={submit}
            enableReinitialize
            initialValues={
              isEditMode
                ? editData
                : {
                    name: '',
                    email: '',
                    is_active: true,
                    is_monetizely_user: false,
                  }
            }
            validationSchema={userSchema}>
            {({ values, errors, touched, setFieldTouched, setFieldValue, handleSubmit }) => {
              return (
                <Box component="form" noValidate sx={{ mt: 1 }}>
                  <Typography className="fieldHeader">
                    <FormattedMessage id="name" />
                    <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <TextField
                    label={<FormattedMessage id="name" />}
                    id="name"
                    name="name"
                    variant="outlined"
                    fullWidth
                    required
                    value={values.name}
                    disabled={editData.id_ext_key}
                    sx={componentStyles.inputSpacing}
                    onChange={(u) => {
                      setFieldValue('name', u.target.value);
                      setTimeout(() => setFieldTouched('name', true));
                    }}
                    error={Boolean(errors.name && touched.name)}
                    helperText={errors.name as string}
                  />
                  <Typography className="fieldHeader">
                    <FormattedMessage id="email" />
                    <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <TextField
                    label={<FormattedMessage id="email" />}
                    id="email"
                    name="email"
                    variant="outlined"
                    fullWidth
                    required
                    value={values.email}
                    disabled={editData.id_ext_key}
                    sx={componentStyles.inputSpacing}
                    onChange={(u) => {
                      setFieldValue('email', u.target.value);
                      setTimeout(() => setFieldTouched('email', true));
                    }}
                    error={Boolean(errors.email && touched.email)}
                    helperText={errors.email as string}
                  />
                  <Typography className="fieldHeader">
                    <FormattedMessage id="alias" />
                  </Typography>
                  <TextField
                    label={<FormattedMessage id="alias" />}
                    id="alias"
                    name="alias"
                    variant="outlined"
                    fullWidth
                    value={values.alias ?? ''}
                    // disabled={editData.id_ext_key}
                    sx={componentStyles.inputSpacing}
                    onChange={(u) => {
                      setFieldValue('alias', u.target.value);
                      setTimeout(() => setFieldTouched('alias', true));
                    }}
                    error={Boolean(errors.alias && touched.alias)}
                    helperText={errors.alias as string}
                  />
                  <Typography className="fieldHeader">
                    <FormattedMessage id="manager" />
                  </Typography>
                  <FormControl fullWidth sx={componentStyles.inputSpacing}>
                    <InputLabel id="manager">
                      <FormattedMessage id="manager" />
                    </InputLabel>
                    <Select
                      labelId="manager"
                      label={<FormattedMessage id="manager" />}
                      id="manager"
                      name="manager_id"
                      fullWidth
                      value={values.manager_id ?? ''}
                      // disabled={editData.id_ext_key}
                      onChange={(u) => {
                        setFieldValue('manager_id', u.target.value);
                        setTimeout(() => setFieldTouched('manager_id', true));
                      }}
                      error={Boolean(errors.manager_id && touched.manager_id)}>
                      {users.map((user: any) => (
                        <MenuItem value={user.id} key={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography className="fieldHeader">
                    <FormattedMessage id="companyOrg" />
                  </Typography>
                  <FormControl fullWidth sx={componentStyles.inputSpacing}>
                    <InputLabel id="companyOrg">
                      <FormattedMessage id="companyOrg" />
                    </InputLabel>
                    <Select
                      labelId="companyOrg"
                      label={<FormattedMessage id="companyOrg" />}
                      id="companyOrg"
                      name="org_hierarchy_id"
                      fullWidth
                      value={values.org_hierarchy_id ?? ''}
                      // disabled={editData.id_ext_key}
                      onChange={(u) => {
                        setFieldValue('org_hierarchy_id', u.target.value);
                        setTimeout(() => setFieldTouched('org_hierarchy_id', true));
                      }}
                      error={Boolean(errors.org_hierarchy_id && touched.org_hierarchy_id)}>
                      {hierarchyList.map((user: any) => (
                        <MenuItem value={user.id} key={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography className="fieldHeader">
                    <FormattedMessage id="userRoles" />
                    {values.is_monetizely_user ? <span style={{ color: 'red' }}> *</span> : ''}
                  </Typography>
                  <FormControl fullWidth sx={componentStyles.inputSpacing}>
                    <InputLabel id="userRoles">
                      <FormattedMessage id="userRoles" />
                    </InputLabel>
                    <Select
                      labelId="userRoles"
                      label={<FormattedMessage id="userRoles" />}
                      id="userRoles"
                      name="user_roles"
                      multiple
                      fullWidth
                      value={values.user_roles ?? []}
                      // disabled={editData.id_ext_key && !values.is_monetizely_user}
                      onChange={(u) => {
                        setFieldValue('user_roles', u.target.value);
                        setTimeout(() => setFieldTouched('user_roles', true));
                      }}
                      error={Boolean(errors.user_roles && touched.user_roles)}>
                      {userRoles.map((user: any) => (
                        <MenuItem value={user} key={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText sx={{ color: '#f44336' }}>
                      {errors.user_roles as string}
                    </FormHelperText>
                  </FormControl>
                  <Box sx={componentStyles.flexContainer}>
                    {checkBoxComponent(
                      values,
                      'is_active',
                      'isActive',
                      setFieldValue,
                      setFieldTouched,
                    )}
                    {checkBoxComponent(
                      values,
                      'is_monetizely_user',
                      'createMonetizelyUser',
                      setFieldValue,
                      setFieldTouched,
                    )}
                  </Box>
                  <DialogActions>
                    <Button sx={styles.dialogButton} onClick={closeUserDialog}>
                      <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                      disabled={isSaving}
                      sx={styles.dialogButton}
                      onClick={() => handleSubmit()}>
                      {isSaving ? (
                        <CircularProgress color="inherit" size={24} />
                      ) : (
                        <FormattedMessage id="save" />
                      )}
                    </Button>
                  </DialogActions>
                </Box>
              );
            }}
          </Formik>
        </DialogContent>
      </Dialog>
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

export default injectIntl(AddUser);
