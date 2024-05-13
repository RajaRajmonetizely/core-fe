import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Auth } from 'aws-amplify';
import { Formik } from 'formik';
import { useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { IVerifyAccount } from '../../models/verify-account';
import schema from './constants';

const theme = createTheme();

const VerifyAccount = () => {
  const userName = useSelector((state: any) => state.auth.userName);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState({
    type: '',
    display: false,
    message: '',
  });
  useEffect(() => {}, [userName]);
  const navigate = useNavigate();

  const displayAlert = (type: string, message: any, timeout: number = 5000) => {
    setAlert({
      type,
      display: true,
      message,
    });
    return setTimeout(() => {
      setAlert({
        type: '',
        display: false,
        message: '',
      });
    }, timeout);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const submit = (values: IVerifyAccount) => {
    setIsLoading(true);
    Auth.signIn(values.email, values.temp_password)
      .then((temp_user) => {
        if (temp_user.challengeName === 'NEW_PASSWORD_REQUIRED') {
          Auth.completeNewPassword(
            temp_user, // the Cognito User Object
            values.password, // the new password
          )
            .then(() => {
              setIsLoading(false);
              displayAlert(
                'success',
                <FormattedMessage id="verifyAccountPasswordChangeSuccess" />,
                5000,
              );
              setTimeout(() => {
                navigate('/login');
              }, 5000);
            })
            .catch(() => {
              displayAlert('error', <FormattedMessage id="verifyAccountPasswordChangeError" />);
              setIsLoading(false);
            });
        } else {
          displayAlert('error', <FormattedMessage id="verifyAccountPasswordChangeError" />);
          setIsLoading(false);
        }
      })
      .catch((er) => {
        displayAlert('error', er.message);
        setIsLoading(false);
      });
  };

  return (
    <>
      {alert.display && (
        <Snackbar
          type={alert.type}
          onClose={() => setAlert({ display: false } as ISnackBar)}
          display={alert.display}
          message={alert.message}
        />
      )}
      <ThemeProvider theme={theme}>
        <Grid
          container
          component="main"
          direction="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            backgroundColor: '#4168e13b',
            height: '100vh',
          }}>
          <Typography
            sx={{
              fontSize: '60px',
              textAlign: 'center',
            }}>
            Monetizely
          </Typography>

          <Grid xs={12} sm={7} md={4} component={Paper} elevation={6}>
            <Box
              sx={{
                my: 8,
                mx: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
              <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                <FormattedMessage id="verifyAccountVerifyAccount" />
              </Typography>
              <Formik
                onSubmit={submit}
                initialValues={{ email: '', temp_password: '', password: '', confirm_password: '' }}
                validationSchema={schema}>
                {({
                  values,
                  errors,
                  touched,
                  setFieldTouched,
                  setFieldValue,
                  handleSubmit,
                  /* and other goodies */
                }) => {
                  return (
                    <Box component="form" noValidate sx={{ mt: 1 }}>
                      <TextField
                        margin="normal"
                        fullWidth
                        id="email"
                        label={<FormattedMessage id="verifyAccountEmailAddress" />}
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={values.email}
                        onChange={(u) => {
                          setFieldValue('email', u.target.value);
                          setTimeout(() => setFieldTouched('email', true));
                        }}
                        error={Boolean(errors.email && touched.email)}
                        helperText={errors.email}
                      />
                      <TextField
                        margin="normal"
                        fullWidth
                        id="temp_password"
                        label={<FormattedMessage id="verifyAccountTemporaryPassword" />}
                        name="temp_password"
                        autoComplete="temp_password"
                        autoFocus
                        value={values.temp_password}
                        onChange={(u) => {
                          setFieldValue('temp_password', u.target.value);
                          setTimeout(() => setFieldTouched('temp_password', true));
                        }}
                        error={Boolean(errors.temp_password && touched.temp_password)}
                        helperText={errors.temp_password}
                      />
                      <TextField
                        margin="normal"
                        fullWidth
                        name="password"
                        label={<FormattedMessage id="verifyAccountPassword" />}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        autoComplete="password"
                        value={values.password}
                        onChange={(u) => {
                          setFieldValue('password', u.target.value);
                          setTimeout(() => setFieldTouched('password', true));
                        }}
                        error={Boolean(errors.password && touched.password)}
                        helperText={errors.password}
                      />
                      <TextField
                        margin="normal"
                        fullWidth
                        name="confirm_password"
                        label={<FormattedMessage id="verifyAccountConfirmPassword" />}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirm_password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowConfirmPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end">
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        autoComplete="confirm_password"
                        value={values.confirm_password}
                        onChange={(u) => {
                          setFieldValue('confirm_password', u.target.value);
                          setTimeout(() => setFieldTouched('confirm_password', true));
                        }}
                        error={Boolean(errors.confirm_password && touched.confirm_password)}
                        helperText={errors.confirm_password}
                      />
                      <Button
                        type="submit"
                        onClick={(event) => {
                          event.preventDefault();
                          handleSubmit();
                        }}
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}>
                        {isLoading ? <CircularProgress color="inherit" /> : 'Confirm'}
                      </Button>
                      <Grid container>
                        <Grid item xs>
                          <Button
                            onClick={() => {
                              navigate('/login');
                            }}>
                            <FormattedMessage id="verifyAccountSignin" />
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                }}
              </Formik>
            </Box>
          </Grid>
        </Grid>
      </ThemeProvider>
    </>
  );
};

export default injectIntl(VerifyAccount);
