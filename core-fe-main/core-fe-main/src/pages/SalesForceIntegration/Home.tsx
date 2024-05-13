import { Box, Button, CircularProgress, Grid, Paper, TextField } from '@mui/material';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import SalesForceClient from '../../api/SalesForce/SalesForceAPIs';
import PageLoader from '../../components/PageLoader/PageLoader';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import commonStyle from '../../styles/commonStyle';
import pageStyle from './pageStyle';

interface IProps {
  intl: any;
  loader: boolean;
}

const Home: React.FC<IProps> = ({ intl, loader }) => {
  const [isLoading, setIsLoading] = useState(false);
  const ability = useSelector((state: any) => state.auth.ability);
  const salesForceSettings = useSelector((state: any) => state.salesForce.salesForceSettings);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  const onSubmit = async (values: any) => {
    if (ability.can('POST', 'Sync to Salesforce')) {
      try {
        setIsLoading(true);
        const response = await SalesForceClient.saveSalesForceConfig(values);
        if (response.message === 'success') {
          setSnackBarValues({
            type: 'success',
            display: true,
            message: intl.formatMessage({ id: 'salesForceSettingsSaved' }),
          });
        }
        setIsLoading(false);
      } catch (e) {
        setIsLoading(false);
      }
    }
  };

  const customText = (
    label: string,
    field: string,
    values: any,
    setFieldValue: any,
    setFieldTouched: any,
    errors: any,
    touched: any,
    type?: string,
  ) => {
    return (
      <TextField
        margin="normal"
        fullWidth
        required
        type={type ?? 'string'}
        label={intl.formatMessage({ id: label })}
        name={field}
        value={values[field]}
        onChange={(u) => {
          setFieldValue(field, u.target.value);
          setTimeout(() => setFieldTouched(field, true));
        }}
        error={Boolean(errors[field] && touched[field])}
        helperText={errors[field]}
      />
    );
  };
  return (
    <Box>
      <Paper sx={pageStyle.inputContainer}>
        <Box sx={pageStyle.cardTitle}>{intl.formatMessage({ id: 'salesForceSettings' })}</Box>
        <Formik
          onSubmit={onSubmit}
          enableReinitialize
          initialValues={
            salesForceSettings.username
              ? salesForceSettings
              : { username: '', password: '', client_id: '', client_secret: '', url: '' }
          }
          validationSchema={Yup.object({
            username: Yup.string().trim().required('Please enter username'),
            password: Yup.string()
              .trim()
              .required('Password is required')
              .min(8, 'Please enter atleast 8 characters')
              .matches(/[a-z]/, 'Should contain at least one lowercase char')
              .matches(/[A-Z]/, 'Should contain at least one uppercase char')
              .matches(/\d+/, 'Should contain at least one digit')
              .matches(/[!@#$%^&*()-+=_|'{}]+/, 'Should contain at least one special char'),
            client_id: Yup.string().required('Please enter client id'),
            client_secret: Yup.string().required('Please enter client secret'),
            url: Yup.string().required('Please enter url'),
          })}>
          {({
            values,
            errors,
            touched,
            setFieldTouched,
            setFieldValue,
            handleSubmit,
            /* and other goodies */
          }) => {
            if (loader) {
              return <PageLoader />;
            }
            return (
              <Box component="form">
                <Grid container spacing={2}>
                  <Grid item md={6}>
                    {customText(
                      'username',
                      'username',
                      values,
                      setFieldValue,
                      setFieldTouched,
                      errors,
                      touched,
                    )}
                  </Grid>
                  <Grid item md={6}>
                    {customText(
                      'password',
                      'password',
                      values,
                      setFieldValue,
                      setFieldTouched,
                      errors,
                      touched,
                      'password',
                    )}
                  </Grid>
                  <Grid item md={6}>
                    {customText(
                      'clientId',
                      'client_id',
                      values,
                      setFieldValue,
                      setFieldTouched,
                      errors,
                      touched,
                    )}
                  </Grid>
                  <Grid item md={6}>
                    {customText(
                      'clientSecret',
                      'client_secret',
                      values,
                      setFieldValue,
                      setFieldTouched,
                      errors,
                      touched,
                      'password',
                    )}
                  </Grid>
                  <Grid item md={6}>
                    {customText(
                      'url',
                      'url',
                      values,
                      setFieldValue,
                      setFieldTouched,
                      errors,
                      touched,
                    )}
                  </Grid>
                </Grid>

                <Button onClick={() => handleSubmit()} sx={{ mt: 3, mb: 2, ...commonStyle.button }}>
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    intl.formatMessage({ id: 'save' })
                  )}
                </Button>
              </Box>
            );
          }}
        </Formik>
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

export default injectIntl(Home);
