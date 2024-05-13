import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { City, Country, State } from 'country-state-city';
import { Formik } from 'formik';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AccountClient from '../../api/Account/AccountAPI';
import IndustryClient from '../../api/Industry/IndustryAPI';
import UserClient from '../../api/Users/UserAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import {
  setDetailedMode,
  setDisabledMode,
  setEditData,
  setEditMode,
  setRefetchData,
} from '../../store/account/account.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import styles from '../../styles/styles';
import Opportunity from '../Opportunity/Opportunity';
import pageStyle from '../SalesForceIntegration/pageStyle';
import schema from './AccountConstants';

const AddAccount: React.FC<any> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [industryList, setIndustryList] = useState<any>([]);
  const isEditMode = useSelector((state: any) => state.account.isEditMode);
  const isDisabledMode = useSelector((state: any) => state.account.isDisabledMode);
  const isDetailedMode = useSelector((state: any) => state.account.isDetailedMode);
  const editData = useSelector((state: any) => state.account.editAccountData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [userList, setUserList] = useState<any>([]);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const editAccountInfo = JSON.parse(localStorage.getItem('AccountInfo') || '{}');
  const localStorageAccountDetailedMode = localStorage.getItem('AccountDetailedMode');

  useEffect(() => {
    getIndustry();
    getUsers();
    if (Object.keys(editAccountInfo).length) {
      dispatch(setEditMode(true));
      dispatch(setEditData(editAccountInfo));
    }
    if (localStorageAccountDetailedMode === 'true') {
      dispatch(setDisabledMode(true));
      dispatch(setDetailedMode(true));
    }
    if (window.location.href.includes('/account/')) {
      dispatch(
        setSection({
          id: 10,
          name: 'account',
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIndustry = () => {
    IndustryClient.getIndustry()
      .then((data) => {
        setIndustryList(data.data);
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  const getUsers = () => {
    UserClient.getUsers()
      .then((data) => setUserList(data.data))
      .catch((error) => console.error(error));
  };

  const handleClose = () => {
    dispatch(setEditMode(false));
    dispatch(setEditData({}));
    dispatch(setDisabledMode(false));
    dispatch(setDetailedMode(false));
    navigate(`/account`);
  };

  const handleEdit = () => {
    dispatch(setDisabledMode(false));
  };

  const submit = async (values: any) => {
    const countries = Country.getAllCountries();
    values.shipping_state = State.getStatesOfCountry(values.shipping_country).find(
      (state) => state.isoCode === values.shipping_state,
    )?.name;
    values.billing_state = State.getStatesOfCountry(values.billing_country).find(
      (state) => state.isoCode === values.billing_state,
    )?.name;
    values.shipping_country = countries.find(
      (country) => country.isoCode === values.shipping_country,
    )?.name;
    values.billing_country = countries.find(
      (country) => country.isoCode === values.billing_country,
    )?.name;
    try {
      setIsSaving(true);
      if (isEditMode) {
        const response = await AccountClient.editAccount(values.id, values);
        if (response.message === 'success') {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'accountUpdated' }),
            type: 'success',
          });
          dispatch(setRefetchData(true));
          setIsSaving(false);
        }
      } else {
        const response = await AccountClient.createAccount(values);
        if (response.message === 'success') {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'accountCreated' }),
            type: 'success',
          });
          dispatch(setRefetchData(true));
          setIsSaving(false);
          navigate('/account');
        }
      }
    } catch (e) {
      setIsSaving(false);
      console.error(e);
    }
  };

  return (
    <>
      <Paper sx={pageStyle.inputContainer}>
        <Box sx={pageStyle.cardTitle}>
          {isEditMode
            ? intl.formatMessage({ id: 'editAccount' })
            : intl.formatMessage({ id: 'addAccount' })}
        </Box>
        <Formik
          onSubmit={submit}
          enableReinitialize
          initialValues={
            isEditMode
              ? editData
              : {
                  name: '',
                  quote_to_name: '',
                  quote_to_address: '',
                  contact_name: '',
                  email: '',
                }
          }
          validationSchema={schema}>
          {({ values, errors, touched, setFieldTouched, setFieldValue, handleSubmit }) => {
            return (
              <>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="account_name" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'account_name' })}
                        id="name"
                        name="name"
                        variant="outlined"
                        fullWidth
                        value={values.name}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('name', u.target.value);
                          setTimeout(() => setFieldTouched('name', true));
                        }}
                        error={Boolean(errors.name && touched.name)}
                        helperText={errors.name as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="type" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'type' })}
                        id="type"
                        name="type"
                        variant="outlined"
                        fullWidth
                        value={values.type}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('type', u.target.value);
                          setTimeout(() => setFieldTouched('type', true));
                        }}
                        error={Boolean(errors.type && touched.type)}
                        helperText={errors.type as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="accountNumber" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'accountNumber' })}
                        id="accountNumber"
                        name="account_number"
                        variant="outlined"
                        fullWidth
                        value={values.account_number}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('account_number', u.target.value);
                          setTimeout(() => setFieldTouched('account_number', true));
                        }}
                        error={Boolean(errors.account_number && touched.account_number)}
                        helperText={errors.account_number as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="website" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'website' })}
                        id="website"
                        name="website"
                        variant="outlined"
                        fullWidth
                        value={values.website}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('website', u.target.value);
                          setTimeout(() => setFieldTouched('website', true));
                        }}
                        error={Boolean(errors.website && touched.website)}
                        helperText={errors.website as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="yearStarted" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'yearStarted' })}
                        id="yearStarted"
                        name="year_started"
                        variant="outlined"
                        fullWidth
                        disabled={editData.account_ext_id || isDisabledMode}
                        value={values.year_started}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('year_started', u.target.value);
                          setTimeout(() => setFieldTouched('year_started', true));
                        }}
                        error={Boolean(errors.year_started && touched.year_started)}
                        helperText={errors.year_started as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="ownerName" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="ownerName">
                          <FormattedMessage id="ownerName" />
                        </InputLabel>
                        <Select
                          labelId="ownerName"
                          label={<FormattedMessage id="ownerName" />}
                          id="ownerName"
                          name="owner_id"
                          fullWidth
                          value={values.owner_id}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('owner_id', u.target.value);
                            setTimeout(() => setFieldTouched('owner_id', true));
                          }}
                          error={Boolean(errors.owner_id && touched.owner_id)}>
                          {userList.map((user: any) => (
                            <MenuItem value={user.id} key={user.id}>
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="site" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'site' })}
                        id="site"
                        name="site"
                        variant="outlined"
                        fullWidth
                        value={values.site}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('site', u.target.value);
                          setTimeout(() => setFieldTouched('site', true));
                        }}
                        error={Boolean(errors.site && touched.site)}
                        helperText={errors.site as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="annualRevenue" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'annualRevenue' })}
                        id="annualRevenue"
                        name="annual_revenue"
                        variant="outlined"
                        fullWidth
                        value={values.annual_revenue}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('annual_revenue', u.target.value);
                          setTimeout(() => setFieldTouched('annual_revenue', true));
                        }}
                        error={Boolean(errors.annual_revenue && touched.annual_revenue)}
                        helperText={errors.annual_revenue as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="numberOfEmployees" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'numberOfEmployees' })}
                        id="numberOfEmployees"
                        name="no_of_employees"
                        variant="outlined"
                        fullWidth
                        value={values.no_of_employees}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('no_of_employees', u.target.value);
                          setTimeout(() => setFieldTouched('no_of_employees', true));
                        }}
                        error={Boolean(errors.no_of_employees && touched.no_of_employees)}
                        helperText={errors.no_of_employees as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="ownership" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'ownership' })}
                        id="ownership"
                        name="ownership"
                        variant="outlined"
                        fullWidth
                        value={values.ownership}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('ownership', u.target.value);
                          setTimeout(() => setFieldTouched('ownership', true));
                        }}
                        error={Boolean(errors.ownership && touched.ownership)}
                        helperText={errors.ownership as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="upsellOpportunity" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'upsellOpportunity' })}
                        id="upsellOpportunity"
                        name="upsell_opportunity"
                        variant="outlined"
                        fullWidth
                        value={values.upsell_opportunity}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('upsell_opportunity', u.target.value);
                          setTimeout(() => setFieldTouched('upsell_opportunity', true));
                        }}
                        error={Boolean(errors.upsell_opportunity && touched.upsell_opportunity)}
                        helperText={errors.upsell_opportunity as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="fundingAmount" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'fundingAmount' })}
                        id="fundingAmount"
                        name="funding_amount"
                        variant="outlined"
                        fullWidth
                        value={values.funding_amount}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('funding_amount', u.target.value);
                          setTimeout(() => setFieldTouched('funding_amount', true));
                        }}
                        error={Boolean(errors.funding_amount && touched.funding_amount)}
                        helperText={errors.funding_amount as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="contactName" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'contactName' })}
                        id="contactName"
                        name="contact_name"
                        variant="outlined"
                        fullWidth
                        value={values.contact_name}
                        disabled={isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('contact_name', u.target.value);
                          setTimeout(() => setFieldTouched('contact_name', true));
                        }}
                        error={Boolean(errors.contact_name && touched.contact_name)}
                        helperText={errors.contact_name as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="verifyAccountEmailAddress" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'verifyAccountEmailAddress' })}
                        id="email"
                        name="email"
                        fullWidth
                        variant="outlined"
                        value={values.email}
                        disabled={isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('email', u.target.value);
                          setTimeout(() => setFieldTouched('email', true));
                        }}
                        error={Boolean(errors.email && touched.email)}
                        helperText={errors.email as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="industryType" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="industryType">
                          <FormattedMessage id="industryType" />
                        </InputLabel>
                        <Select
                          labelId="industryType"
                          label={intl.formatMessage({ id: 'industryType' })}
                          id="industryTypeId"
                          name="industry_type_id"
                          fullWidth
                          value={values.industry_type_id}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('industry_type_id', u.target.value);
                            setTimeout(() => setFieldTouched('industry_type_id', true));
                          }}
                          error={Boolean(errors.industry_type_id && touched.industry_type_id)}>
                          {industryList.map((industry: any) => (
                            <MenuItem value={industry.id} key={industry.id}>
                              {industry.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="quoteToName" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'name' })}
                        id="quoteToName"
                        name="quote_to_name"
                        variant="outlined"
                        fullWidth
                        value={values.quote_to_name}
                        disabled={isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('quote_to_name', u.target.value);
                          setTimeout(() => setFieldTouched('quote_to_name', true));
                        }}
                        error={Boolean(errors.quote_to_name && touched.quote_to_name)}
                        helperText={errors.quote_to_name as string}
                      />
                    </Grid>
                    <Grid item md={3}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="quoteToAddress" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <TextField
                        multiline
                        fullWidth
                        label={intl.formatMessage({ id: 'quoteToAddress' })}
                        id="quoteToAddress"
                        name="quote_to_address"
                        variant="outlined"
                        value={values.quote_to_address}
                        disabled={isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('quote_to_address', u.target.value);
                          setTimeout(() => setFieldTouched('quote_to_address', true));
                        }}
                        error={Boolean(errors.quote_to_address && touched.quote_to_address)}
                        helperText={errors.quote_to_address as string}
                      />
                    </Grid>
                    <Grid item md={6}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="description" />
                      </Typography>
                      <TextField
                        multiline
                        fullWidth
                        label={intl.formatMessage({ id: 'description' })}
                        id="description"
                        name="description"
                        variant="outlined"
                        value={values.description}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('description', u.target.value);
                          setTimeout(() => setFieldTouched('description', true));
                        }}
                        error={Boolean(errors.description && touched.description)}
                        helperText={errors.description as string}
                      />
                    </Grid>
                  </Grid>
                  <br />
                  <Typography className="dialogHeading">
                    <FormattedMessage id="shippingAddress" />
                  </Typography>
                  <hr />
                  <br />
                  <Grid container spacing={2}>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="country" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="countryList">
                          <FormattedMessage id="country" />
                        </InputLabel>
                        <Select
                          labelId="countryList"
                          label={intl.formatMessage({ id: 'country' })}
                          id="country"
                          name="shipping_country"
                          fullWidth
                          value={values.shipping_country}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('shipping_country', u.target.value);
                            setTimeout(() => setFieldTouched('shipping_country', true));
                          }}
                          error={Boolean(errors.shipping_country && touched.shipping_country)}>
                          {Country.getAllCountries().map((country: any) => (
                            <MenuItem value={country.isoCode} key={country.isoCode}>
                              {country.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="state" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="stateList">
                          <FormattedMessage id="state" />
                        </InputLabel>
                        <Select
                          labelId="stateList"
                          label={intl.formatMessage({ id: 'state' })}
                          id="state"
                          name="shipping_state"
                          fullWidth
                          value={values.shipping_state}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('shipping_state', u.target.value);
                            setTimeout(() => setFieldTouched('shipping_state', true));
                          }}
                          error={Boolean(errors.shipping_state && touched.shipping_state)}>
                          {State.getStatesOfCountry(values.shipping_country).map((state: any) => (
                            <MenuItem value={state.isoCode} key={state.isoCode}>
                              {state.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="city" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="cityList">
                          <FormattedMessage id="city" />
                        </InputLabel>
                        <Select
                          labelId="cityList"
                          label={intl.formatMessage({ id: 'city' })}
                          id="city"
                          name="shipping_city"
                          fullWidth
                          value={values.shipping_city}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('shipping_city', u.target.value);
                            setTimeout(() => setFieldTouched('shipping_city', true));
                          }}
                          error={Boolean(errors.shipping_city && touched.shipping_city)}>
                          {City.getCitiesOfState(
                            values.shipping_country,
                            values.shipping_state,
                          ).map((city: any) => (
                            <MenuItem value={city.name} key={city.name}>
                              {city.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="street" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'street' })}
                        id="shippingStreet"
                        name="shipping_street"
                        variant="outlined"
                        fullWidth
                        value={values.shipping_street}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('shipping_street', u.target.value);
                          setTimeout(() => setFieldTouched('shipping_street', true));
                        }}
                        error={Boolean(errors.shipping_street && touched.shipping_street)}
                        helperText={errors.shipping_street as string}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="zipcode" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'zipcode' })}
                        id="shippingPostalCode"
                        name="shipping_postal_code"
                        variant="outlined"
                        fullWidth
                        value={values.shipping_postal_code}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('shipping_postal_code', u.target.value);
                          setTimeout(() => setFieldTouched('shipping_postal_code', true));
                        }}
                        error={Boolean(errors.shipping_postal_code && touched.shipping_postal_code)}
                        helperText={errors.shipping_postal_code as string}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="shipTo" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'name' })}
                        id="shipToName"
                        name="ship_to_name"
                        variant="outlined"
                        fullWidth
                        value={values.ship_to_name}
                        disabled={isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('ship_to_name', u.target.value);
                          setTimeout(() => setFieldTouched('ship_to_name', true));
                        }}
                        error={Boolean(errors.ship_to_name && touched.ship_to_name)}
                        helperText={errors.ship_to_name as string}
                      />
                    </Grid>
                  </Grid>
                  <br />
                  <Typography className="dialogHeading">
                    <FormattedMessage id="billingAddress" />
                  </Typography>
                  <hr />
                  <br />
                  <Grid container spacing={2}>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="country" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="billingCountryList">
                          <FormattedMessage id="country" />
                        </InputLabel>
                        <Select
                          labelId="billingCountryList"
                          label={intl.formatMessage({ id: 'country' })}
                          id="country"
                          name="billing_country"
                          fullWidth
                          value={values.billing_country}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('billing_country', u.target.value);
                            setTimeout(() => setFieldTouched('billing_country', true));
                          }}
                          error={Boolean(errors.billing_country && touched.billing_country)}>
                          {Country.getAllCountries().map((country: any) => (
                            <MenuItem value={country.isoCode} key={country.isoCode}>
                              {country.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="state" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="billingStateList">
                          <FormattedMessage id="state" />
                        </InputLabel>
                        <Select
                          labelId="billingStateList"
                          label={intl.formatMessage({ id: 'state' })}
                          id="state"
                          name="billing_state"
                          fullWidth
                          value={values.billing_state}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('billing_state', u.target.value);
                            setTimeout(() => setFieldTouched('billing_state', true));
                          }}
                          error={Boolean(errors.billing_state && touched.billing_state)}>
                          {State.getStatesOfCountry(values.billing_country).map((state: any) => (
                            <MenuItem value={state.isoCode} key={state.isoCode}>
                              {state.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="city" />
                      </Typography>
                      <FormControl fullWidth sx={{ marginTop: '10px' }}>
                        <InputLabel id="billingCityList">
                          <FormattedMessage id="city" />
                        </InputLabel>
                        <Select
                          labelId="billingCityList"
                          label={intl.formatMessage({ id: 'city' })}
                          id="city"
                          name="billing_city"
                          fullWidth
                          value={values.billing_city}
                          disabled={editData.account_ext_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('billing_city', u.target.value);
                            setTimeout(() => setFieldTouched('billing_city', true));
                          }}
                          error={Boolean(errors.billing_city && touched.billing_city)}>
                          {City.getCitiesOfState(values.billing_country, values.billing_state).map(
                            (city: any) => (
                              <MenuItem value={city.name} key={city.name}>
                                {city.name}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="street" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'street' })}
                        id="billingStreet"
                        name="billing_street"
                        variant="outlined"
                        fullWidth
                        value={values.billing_street}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('billing_street', u.target.value);
                          setTimeout(() => setFieldTouched('billing_street', true));
                        }}
                        error={Boolean(errors.billing_street && touched.billing_street)}
                        helperText={errors.billing_street as string}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="zipcode" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'zipcode' })}
                        id="billingPostalCode"
                        name="billing_postal_code"
                        variant="outlined"
                        fullWidth
                        value={values.billing_postal_code}
                        disabled={editData.account_ext_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('billing_postal_code', u.target.value);
                          setTimeout(() => setFieldTouched('billing_postal_code', true));
                        }}
                        error={Boolean(errors.billing_postal_code && touched.billing_postal_code)}
                        helperText={errors.billing_postal_code as string}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="billTo" />
                      </Typography>
                      <TextField
                        label={intl.formatMessage({ id: 'name' })}
                        id="billToName"
                        name="bill_to_name"
                        variant="outlined"
                        fullWidth
                        value={values.bill_to_name}
                        disabled={isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('bill_to_name', u.target.value);
                          setTimeout(() => setFieldTouched('bill_to_name', true));
                        }}
                        error={Boolean(errors.bill_to_name && touched.bill_to_name)}
                        helperText={errors.bill_to_name as string}
                      />
                    </Grid>
                  </Grid>
                </Box>
                {isDetailedMode ? (
                  <Box
                    sx={{
                      textAlign: 'right',
                      marginTop: '10px',
                    }}>
                    <Button sx={styles.dialogButton} onClick={handleEdit}>
                      <FormattedMessage id="edit" />
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      textAlign: 'right',
                      marginTop: '10px',
                    }}>
                    <Button sx={{ ...styles.dialogButton, marginRight: 2 }} onClick={handleClose}>
                      <FormattedMessage id="back" />
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
                  </Box>
                )}
                <br />
                {isDetailedMode ? (
                  <>
                    <Opportunity />
                    <br />
                    <Box
                      sx={{
                        textAlign: 'right',
                        marginTop: '10px',
                      }}>
                      <Button sx={{ ...styles.dialogButton, marginRight: 2 }} onClick={handleClose}>
                        <FormattedMessage id="back" />
                      </Button>
                      <Button
                        disabled={isSaving || isDisabledMode}
                        sx={styles.dialogButton}
                        onClick={() => handleSubmit()}>
                        {isSaving ? (
                          <CircularProgress color="inherit" size={24} />
                        ) : (
                          <FormattedMessage id="save" />
                        )}
                      </Button>
                    </Box>
                  </>
                ) : null}
              </>
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
    </>
  );
};

export default injectIntl(AddAccount);
