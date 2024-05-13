import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { City, Country, State } from 'country-state-city';
import { Formik } from 'formik';
import _ from 'lodash';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import TenantsClient from '../../api/Tenant/TenantAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setEditData, setEditMode, setRefetchData } from '../../store/tenant/tenant.slice';
import styles from '../../styles/styles';
import { schema, userSchema } from './TenantConstants';

const componentStyles = {
  importUsersBtn: {
    marginLeft: '12px',
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
};

const AddTenant: React.FC<any> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const [isOppDialogOpen, setUsersDialogOpen] = useState<boolean>(false);
  const isEditMode = useSelector((state: any) => state.tenants.isEditMode);
  const editData = useSelector((state: any) => state.tenants.editTenantData);
  const [editInfo, setEditInfo] = useState<any>(editData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  useEffect(() => {
    if (isEditMode) {
      const filledInfo = { ...editData };
      const countries = Country.getAllCountries();
      filledInfo.country = countries.find(
        (country) => country.name === filledInfo.country,
      )?.isoCode;
      filledInfo.state = State.getStatesOfCountry(filledInfo.country).find(
        (state) => state.name === filledInfo.state,
      )?.isoCode;
      setEditInfo(
        _.pick(filledInfo, [
          'id',
          'name',
          'address',
          'country',
          'city',
          'state',
          'postal_code',
          'notes',
        ]),
      );
      setUsersDialogOpen(true);
    }
    // eslint-disable-next-line
  }, [isEditMode]);

  const openUserDialog = () => {
    setUsersDialogOpen(true);
  };

  const closeUserDialog = () => {
    dispatch(setEditMode(false));
    dispatch(setEditData({}));
    setUsersDialogOpen(false);
  };

  const onSubmit = async (values: any) => {
    const countries = Country.getAllCountries();
    values.state = State.getStatesOfCountry(values.country).find(
      (state) => state.isoCode === values.state,
    )?.name;
    values.country = countries.find((country) => country.isoCode === values.country)?.name;
    try {
      setIsSaving(true);
      if (isEditMode) {
        const response = await TenantsClient.updateTenant(values.id, values);
        if (response.data) {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'tenantUpdated' }),
            type: 'success',
          });
          dispatch(setRefetchData(true));
          dispatch(setEditMode(false));
          dispatch(setEditData({}));
          setIsSaving(false);
          setUsersDialogOpen(false);
        }
      } else {
        const response = await TenantsClient.addTenant(values);
        if (response.data) {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'tenantCreated' }),
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

  return (
    <>
      <Button
        sx={styles.dialogButton}
        onClick={() => {
          openUserDialog();
        }}>
        <FormattedMessage id="addTenant" />
      </Button>
      <Dialog open={isOppDialogOpen} fullWidth maxWidth="md">
        <DialogTitle className="fieldHeader">
          <FormattedMessage id={isEditMode ? 'updateTenant' : 'addTenant'} />
        </DialogTitle>
        <DialogContent dividers>
          <Formik
            onSubmit={onSubmit}
            enableReinitialize
            initialValues={
              isEditMode
                ? editInfo
                : {
                    name: '',
                    user_name: '',
                    user_email: '',
                    address: '',
                    country: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    notes: '',
                  }
            }
            validationSchema={isEditMode ? schema : schema.concat(userSchema)}>
            {({ values, errors, touched, setFieldTouched, setFieldValue, handleSubmit }) => {
              return (
                <Box component="form" noValidate sx={{ mt: 1 }}>
                  <Grid container>
                    <Grid item md={12} mr={1}>
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
                        value={values.name || ''}
                        sx={componentStyles.inputSpacing}
                        onChange={(u) => {
                          setFieldValue('name', u.target.value);
                          setTimeout(() => setFieldTouched('name', true));
                        }}
                        error={Boolean(errors.name && touched.name)}
                        helperText={errors.name as string}
                      />
                    </Grid>
                    <br />
                    {!isEditMode ? (
                      <>
                        <Grid item md={12} mr={1}>
                          <Typography className="dialogHeading">
                            <FormattedMessage id="tenantAdmin" />
                          </Typography>
                          <hr />
                        </Grid>
                        <Grid item md={5.5} mr={8}>
                          <Typography className="fieldHeader">
                            <FormattedMessage id="name" />
                            <span style={{ color: 'red' }}> *</span>
                          </Typography>
                          <TextField
                            label={<FormattedMessage id="name" />}
                            id="user_name"
                            name="user_name"
                            variant="outlined"
                            fullWidth
                            required
                            value={values.user_name}
                            sx={componentStyles.inputSpacing}
                            onChange={(u) => {
                              setFieldValue('user_name', u.target.value);
                              setTimeout(() => setFieldTouched('user_name', true));
                            }}
                            error={Boolean(errors.user_name && touched.user_name)}
                            helperText={errors.user_name as string}
                          />
                        </Grid>
                        <Grid item md={5.5} mr={1}>
                          <Typography className="fieldHeader">
                            <FormattedMessage id="email" />
                            <span style={{ color: 'red' }}> *</span>
                          </Typography>
                          <TextField
                            label={<FormattedMessage id="email" />}
                            id="user_email"
                            name="user_email"
                            variant="outlined"
                            fullWidth
                            required
                            value={values.user_email}
                            sx={componentStyles.inputSpacing}
                            onChange={(u) => {
                              setFieldValue('user_email', u.target.value);
                              setTimeout(() => setFieldTouched('user_email', true));
                            }}
                            error={Boolean(errors.user_email && touched.user_email)}
                            helperText={errors.user_email as string}
                          />
                        </Grid>
                        <br />
                      </>
                    ) : null}
                    <Grid item md={12} mr={1}>
                      <Typography className="dialogHeading">
                        <FormattedMessage id="tenantAddress" />
                      </Typography>
                      <hr />
                    </Grid>
                    <Grid item md={12} mr={1}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="address" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        multiline
                        fullWidth
                        label={intl.formatMessage({ id: 'address' })}
                        id="address"
                        name="address"
                        variant="outlined"
                        required
                        value={values.address || ''}
                        sx={componentStyles.inputSpacing}
                        onChange={(u) => {
                          setFieldValue('address', u.target.value);
                          setTimeout(() => setFieldTouched('address', true));
                        }}
                        error={Boolean(errors.address && touched.address)}
                        helperText={errors.address as string}
                      />
                    </Grid>
                    <Grid item md={5.5} mr={8}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="country" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <FormControl fullWidth sx={componentStyles.inputSpacing}>
                        <InputLabel id="countryList">
                          <FormattedMessage id="country" />
                        </InputLabel>
                        <Select
                          labelId="countryList"
                          label={intl.formatMessage({ id: 'country' })}
                          id="country"
                          name="country"
                          fullWidth
                          value={values.country || ''}
                          onChange={(u) => {
                            setFieldValue('country', u.target.value);
                            setTimeout(() => setFieldTouched('country', true));
                          }}
                          error={Boolean(errors.country && touched.country)}>
                          {Country.getAllCountries().map((country: any) => (
                            <MenuItem value={country.isoCode} key={country.isoCode}>
                              {country.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={5.5} mr={1}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="state" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <FormControl fullWidth sx={componentStyles.inputSpacing}>
                        <InputLabel id="stateList">
                          <FormattedMessage id="state" />
                        </InputLabel>
                        <Select
                          labelId="stateList"
                          label={intl.formatMessage({ id: 'state' })}
                          id="state"
                          name="state"
                          fullWidth
                          value={values.state || ''}
                          onChange={(u) => {
                            setFieldValue('state', u.target.value);
                            setTimeout(() => setFieldTouched('state', true));
                          }}
                          error={Boolean(errors.state && touched.state)}>
                          {State.getStatesOfCountry(values.country).map((state: any) => (
                            <MenuItem value={state.isoCode} key={state.isoCode}>
                              {state.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={5.5} mr={8}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="city" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <FormControl fullWidth sx={componentStyles.inputSpacing}>
                        <InputLabel id="cityList">
                          <FormattedMessage id="city" />
                        </InputLabel>
                        <Select
                          labelId="cityList"
                          label={intl.formatMessage({ id: 'city' })}
                          id="city"
                          name="city"
                          fullWidth
                          value={values.city || ''}
                          onChange={(u) => {
                            setFieldValue('city', u.target.value);
                            setTimeout(() => setFieldTouched('city', true));
                          }}
                          error={Boolean(errors.city && touched.city)}>
                          {City.getCitiesOfState(values.country, values.state).map((city: any) => (
                            <MenuItem value={city.name} key={city.name}>
                              {city.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={5.5} mr={1}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="zipcode" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        fullWidth
                        label={intl.formatMessage({ id: 'zipcode' })}
                        id="postalCode"
                        name="postal_code"
                        variant="outlined"
                        required
                        value={values.postal_code || ''}
                        sx={componentStyles.inputSpacing}
                        onChange={(u) => {
                          setFieldValue('postal_code', u.target.value);
                          setTimeout(() => setFieldTouched('postal_code', true));
                        }}
                        error={Boolean(errors.postal_code && touched.postal_code)}
                        helperText={errors.postal_code as string}
                      />
                    </Grid>
                    <Grid item md={12} mr={1}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="notes" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        multiline
                        fullWidth
                        label={intl.formatMessage({ id: 'notes' })}
                        id="notes"
                        name="notes"
                        variant="outlined"
                        required
                        value={values.notes || ''}
                        sx={componentStyles.inputSpacing}
                        onChange={(u) => {
                          setFieldValue('notes', u.target.value);
                          setTimeout(() => setFieldTouched('notes', true));
                        }}
                        error={Boolean(errors.notes && touched.notes)}
                        helperText={errors.notes as string}
                      />
                    </Grid>
                  </Grid>

                  <DialogActions>
                    <Button sx={styles.dialogButton} onClick={closeUserDialog}>
                      <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                      disabled={isSaving}
                      sx={styles.dialogButton}
                      onClick={() => {
                        handleSubmit();
                      }}>
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

export default injectIntl(AddTenant);
