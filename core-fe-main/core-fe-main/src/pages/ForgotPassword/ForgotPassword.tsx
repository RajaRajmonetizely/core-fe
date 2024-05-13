import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as Yup from 'yup';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Auth } from 'aws-amplify';
import { Formik } from 'formik';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import schema from './constants';

const theme = createTheme();

const ForgotPassword = () => {
  const userName = useSelector((state: any) => state.auth.userName);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({
    type: '',
    display: false,
    message: '',
  });
  useEffect(() => {}, [userName]);
  const navigate = useNavigate();

  const displayAlert = (type: string, message: any) => {
    setAlert({
      type,
      display: true,
      message,
    });
    setTimeout(() => {
      setAlert({
        type: '',
        display: false,
        message: '',
      });
    }, 5000);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const submit = (values: any) => {
    setIsLoading(true);
    Auth.forgotPassword(values.email)
      .then(() => {
        setIsLoading(false);
        displayAlert('success', 'Verification code has been sent to your email');
        setEmail(values.email);
        setIsForgotPasswordMode(true);
      })
      .catch((er) => {
        displayAlert('error', er.message);
        setIsLoading(false);
      });
  };

  const submitNewPassword = (values: any) => {
    setIsLoading(true);
    Auth.forgotPasswordSubmit(values.email, values.verificationCode, values.password)
      .then(() => {
        setIsLoading(false);
        displayAlert('success', 'Your password has been successfully created');
        navigate('/login');
      })
      .catch((error) => {
        displayAlert('error', error.message);
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
            <FormattedMessage id="monetizely" />
          </Typography>

          {isForgotPasswordMode ? (
            <Grid item xs={12} sm={7} md={4} component={Paper} elevation={6}>
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
                  <FormattedMessage id="createNewPassword" />
                </Typography>
                <Formik
                  onSubmit={submitNewPassword}
                  initialValues={{ email: '', verificationCode: '', password: '' }}
                  validationSchema={schema}>
                  {({ values, errors, touched, setFieldTouched, setFieldValue, handleSubmit }) => {
                    return (
                      <Box component="form" noValidate sx={{ mt: 1 }}>
                        <TextField
                          margin="normal"
                          fullWidth
                          id="email"
                          label={<FormattedMessage id="emailAddress" />}
                          name="email"
                          autoComplete="email"
                          autoFocus
                          defaultValue={email}
                          InputProps={{ readOnly: true }}
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
                          id="verificationCode"
                          label={<FormattedMessage id="verificationCode" />}
                          name="verificationCode"
                          autoFocus
                          value={values.verificationCode}
                          onChange={(u) => {
                            setFieldValue('verificationCode', u.target.value);
                            setTimeout(() => setFieldTouched('verificationCode', true));
                          }}
                          error={Boolean(errors.verificationCode && touched.verificationCode)}
                          helperText={errors.verificationCode}
                        />
                        <TextField
                          margin="normal"
                          fullWidth
                          id="password"
                          label={<FormattedMessage id="newPassword" />}
                          name="password"
                          autoComplete="password"
                          autoFocus
                          type={showPassword ? 'text' : 'password'}
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
                          value={values.password}
                          onChange={(u) => {
                            setFieldValue('password', u.target.value);
                            setTimeout(() => setFieldTouched('password', true));
                          }}
                          error={Boolean(errors.password && touched.password)}
                          helperText={errors.password}
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
                          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                        </Button>
                        <Grid container>
                          <Grid item xs>
                            <Button
                              onClick={() => {
                                navigate('/login');
                              }}>
                              <FormattedMessage id="back" />
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  }}
                </Formik>
              </Box>
            </Grid>
          ) : (
            <Grid item xs={12} sm={7} md={4} component={Paper} elevation={6}>
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
                  <FormattedMessage id="forgotPassword" />
                </Typography>
                <Formik
                  onSubmit={submit}
                  initialValues={{ email: '' }}
                  validationSchema={Yup.object({
                    email: Yup.string().required('Email is required'),
                  })}>
                  {({ values, errors, touched, setFieldTouched, setFieldValue, handleSubmit }) => {
                    return (
                      <Box component="form" noValidate sx={{ mt: 1 }}>
                        <TextField
                          margin="normal"
                          fullWidth
                          id="email"
                          label={<FormattedMessage id="emailAddress" />}
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
                        <Button
                          type="submit"
                          onClick={(event) => {
                            event.preventDefault();
                            handleSubmit();
                          }}
                          fullWidth
                          variant="contained"
                          sx={{ mt: 3, mb: 2 }}>
                          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                        </Button>
                        <Grid container>
                          <Grid item xs>
                            <Button
                              onClick={() => {
                                navigate('/login');
                              }}>
                              <FormattedMessage id="back" />
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  }}
                </Formik>
              </Box>
            </Grid>
          )}
        </Grid>
      </ThemeProvider>
    </>
  );
};

export default ForgotPassword;
