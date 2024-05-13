import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Auth } from 'aws-amplify';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { ILogin } from '../../models/login';
import { addUser } from '../../store/auth/auth.slice';
import { setUserAttributes } from '../../utils/auth';
import schema from './LoginConstants';

const theme = createTheme();

const Login = () => {
  const userName = useSelector((state: any) => state.auth.userName);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({
    type: '',
    display: false,
    message: '',
  });
  useEffect(() => {}, [userName]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

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

  const submit = (values: ILogin) => {
    setIsLoading(true);
    Auth.signIn(values.email, values.password)
      .then((user: any) => {
        if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
          setIsLoading(false);
          displayAlert('error', 'Your account requires verification. Redirecting you...');
          setTimeout(() => {
            navigate('/verify-account');
          }, 3000);
        } else {
          setIsLoading(false);
          setUserAttributes(user.username, user.attributes);
          const userInfo = {
            userName: user.username,
            attributes: user.attributes,
          };
          dispatch(addUser(userInfo));
          navigate('/');
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
                Sign in
              </Typography>
              <Formik
                onSubmit={submit}
                initialValues={{ email: '', password: '' }}
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
                        label="Email Address"
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
                        name="password"
                        label="Password"
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
                        id="password"
                        autoComplete="password"
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
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                      </Button>
                      <Grid container>
                        <Grid item xs>
                          <Button
                            onClick={() => {
                              navigate('/forgot-password');
                            }}>
                            Forgot password?
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

export default Login;
