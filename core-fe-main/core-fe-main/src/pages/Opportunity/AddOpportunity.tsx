import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import AccountClient from '../../api/Account/AccountAPI';
import OpportunityClient from '../../api/Opportunity/OpportunityAPI';
import UserClient from '../../api/Users/UserAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import {
  setDetailedMode,
  setDisabledMode,
  setEditData,
  setEditMode,
  setRefetchData,
} from '../../store/opportunity/opportunity.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import styles from '../../styles/styles';
import { REGEX } from '../../utils/helperService';
import DealHub from '../DealHub/DealHub';
import pageStyle from '../SalesForceIntegration/pageStyle';
import './Opportunity.scss';

const AddOpportunity: React.FC<any> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [oppStageList, setOppStageList] = useState<any>([]);
  const [oppTypeList, setOppTypeList] = useState<any>([]);
  const [accountList, setAccountList] = useState<any>([]);
  const [userList, setUserList] = useState<any>([]);
  const isEditMode = useSelector((state: any) => state.opportunity.isEditMode);
  const editData = useSelector((state: any) => state.opportunity.editOpportunityData);
  const isDisabledMode = useSelector((state: any) => state.opportunity.isDisabledMode);
  const isDetailedMode = useSelector((state: any) => state.opportunity.isDetailedMode);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const opportunities = useSelector((state: any) => state.opportunity.opportunities);
  const editOpportunityInfo = JSON.parse(localStorage.getItem('OpportunityInfo') || '{}');
  const localStorageOpportunityDetailedMode = localStorage.getItem('OpportunityDetailedMode');

  useEffect(() => {
    getOppStages();
    getOppTypes();
    getAccounts();
    getUsers();
    if (Object.keys(editOpportunityInfo).length) {
      dispatch(setEditMode(true));
      dispatch(setEditData(editOpportunityInfo));
    }
    if (localStorageOpportunityDetailedMode === 'true') {
      dispatch(setDisabledMode(true));
      dispatch(setDetailedMode(true));
    }
    if (window.location.href.includes('/opportunity/')) {
      dispatch(
        setSection({
          id: 15,
          name: 'opportunity',
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOppStages = () => {
    OpportunityClient.getOpportunityStage()
      .then((data) => setOppStageList(data.data))
      .catch((error: any) => console.error(error));
  };

  const getOppTypes = () => {
    OpportunityClient.getOpportunityType()
      .then((data) => setOppTypeList(data.data))
      .catch((error: any) => console.error(error));
  };

  const getAccounts = () => {
    AccountClient.getAccounts()
      .then((data) => setAccountList(data.data))
      .catch((error: any) => console.error(error));
  };

  const getUsers = () => {
    UserClient.getUsers()
      .then((data) => setUserList(data.data))
      .catch((error) => console.error(error));
  };

  const closeOpportunityDialog = () => {
    dispatch(setEditMode(false));
    dispatch(setEditData({}));
    dispatch(setDisabledMode(false));
    dispatch(setDetailedMode(false));
    window.history.back();
  };

  const handleEdit = () => {
    dispatch(setDisabledMode(false));
  };

  const isValidData = (data: any) => {
    let isValid = true;
    if (
      (isEditMode &&
        opportunities
          .filter((o: any) => o.id !== editData?.id)
          .some((op: any) => op.name === data.name.trim())) ||
      (!isEditMode && opportunities.some((op: any) => op.name === data.name.trim()))
    ) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'oppNameAlreadyExistsMessage' }),
      });
      isValid = false;
    }
    return isValid;
  };

  const submit = async (values: any) => {
    if (isValidData(values)) {
      try {
        values.close_date = dayjs(values.close_date).toISOString();
        setIsSaving(true);
        if (isEditMode) {
          const response = await OpportunityClient.editOpportunity(values.id, values);
          if (response.message === 'success') {
            setSnackBarValues({
              display: true,
              message: intl.formatMessage({ id: 'opportunityUpdated' }),
              type: 'success',
            });
            dispatch(setRefetchData(true));
            setIsSaving(false);
          }
        } else {
          const response = await OpportunityClient.createOpportunity(values);
          if (response.message === 'success') {
            setSnackBarValues({
              display: true,
              message: intl.formatMessage({ id: 'opportunityCreated' }),
              type: 'success',
            });
            dispatch(setRefetchData(true));
            setIsSaving(false);
            navigate('/opportunity');
          }
        }
      } catch (e) {
        setIsSaving(false);
        console.error(e);
      }
    }
  };

  return (
    <>
      <Paper sx={pageStyle.inputContainer}>
        <Box sx={pageStyle.cardTitle}>
          {isEditMode
            ? intl.formatMessage({ id: 'editOpportunity' })
            : intl.formatMessage({ id: 'addOpportunity' })}
        </Box>
        <Formik
          onSubmit={submit}
          enableReinitialize
          initialValues={
            isEditMode
              ? editData
              : {
                  name: '',
                  account_id: accountList.length === 1 ? accountList[0].id : '',
                  owner_id: userList.length === 1 ? userList[0].id : '',
                  type_id: oppTypeList.length === 1 ? oppTypeList[0].id : '',
                  stage_id: oppStageList.length === 1 ? oppStageList[0].id : '',
                }
          }
          validationSchema={Yup.object({
            name: Yup.string()
              .trim()
              .required('Please enter name')
              .matches(
                REGEX,
                'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
              ),
            amount: Yup.number().nullable(),
            probability: Yup.number().nullable(),
            close_date: Yup.date().nullable(),
            description: Yup.string().nullable(),
            account_id: Yup.string().required('Please select account'),
            owner_id: Yup.string().required('Please select owner'),
            type_id: Yup.string().required('Please select type'),
            stage_id: Yup.string().required('Please select stage'),
          })}>
          {({ values, errors, touched, setFieldTouched, setFieldValue, handleSubmit }) => {
            return (
              <>
                <Box component="form" noValidate sx={{ mt: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item md={4}>
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
                        value={values.name}
                        disabled={editData.op_external_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('name', u.target.value);
                          setTimeout(() => setFieldTouched('name', true));
                        }}
                        error={Boolean(errors.name && touched.name)}
                        helperText={errors.name as string}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="amount" />
                      </Typography>
                      <TextField
                        label={<FormattedMessage id="amount" />}
                        id="amount"
                        name="amount"
                        variant="outlined"
                        value={values.amount}
                        fullWidth
                        disabled={editData.op_external_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('amount', u.target.value);
                          setTimeout(() => setFieldTouched('amount', true));
                        }}
                        error={Boolean(errors.amount && touched.amount)}
                        helperText={errors.amount as string}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="probability" />
                      </Typography>
                      <TextField
                        label={<FormattedMessage id="probability" />}
                        id="probability"
                        name="probability"
                        variant="outlined"
                        fullWidth
                        value={values.probability}
                        disabled={editData.op_external_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('probability', u.target.value);
                          setTimeout(() => setFieldTouched('probability', true));
                        }}
                        error={Boolean(errors.probability && touched.probability)}
                        helperText={errors.probability as string}
                      />
                    </Grid>

                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="closeDate" />
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          label={<FormattedMessage id="closeDate" />}
                          value={dayjs(values.close_date)}
                          sx={{ marginTop: '10px', width: '100%' }}
                          disablePast
                          format="MM/DD/YYYY"
                          disabled={editData.op_external_id || isDisabledMode}
                          onChange={(u: any) => {
                            setFieldValue('close_date', u);
                            setTimeout(() => setFieldTouched('close_date', true));
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="description" />
                      </Typography>
                      <TextField
                        multiline
                        fullWidth
                        label={<FormattedMessage id="description" />}
                        id="description"
                        name="description"
                        variant="outlined"
                        value={values.description}
                        disabled={editData.op_external_id || isDisabledMode}
                        sx={{ marginTop: '10px' }}
                        onChange={(u) => {
                          setFieldValue('description', u.target.value);
                          setTimeout(() => setFieldTouched('description', true));
                        }}
                        error={Boolean(errors.description && touched.description)}
                        helperText={errors.description as string}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="accountName" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <FormControl
                        error={Boolean(errors.account_id && touched.account_id)}
                        fullWidth
                        sx={{ marginTop: '10px' }}>
                        <InputLabel id="accountName">
                          <FormattedMessage id="accountName" />
                        </InputLabel>
                        <Select
                          labelId="accountName"
                          label={<FormattedMessage id="accountName" />}
                          id="accountName"
                          name="account_id"
                          fullWidth
                          value={values.account_id}
                          disabled={editData.op_external_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('account_id', u.target.value);
                            setTimeout(() => setFieldTouched('account_id', true));
                          }}>
                          {accountList.map((account: any) => (
                            <MenuItem value={account.id} key={account.id}>
                              {account.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.account_id && touched.account_id ? (
                          <FormHelperText>{errors.account_id as string}</FormHelperText>
                        ) : null}
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="ownerName" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <FormControl
                        error={Boolean(errors.owner_id && touched.owner_id)}
                        fullWidth
                        sx={{ marginTop: '10px' }}>
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
                          disabled={editData.op_external_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('owner_id', u.target.value);
                            setTimeout(() => setFieldTouched('owner_id', true));
                          }}>
                          {userList.map((user: any) => (
                            <MenuItem value={user.id} key={user.id}>
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.owner_id && touched.owner_id ? (
                          <FormHelperText>{errors.owner_id as string}</FormHelperText>
                        ) : null}
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="typeName" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <FormControl
                        error={Boolean(errors.type_id && touched.type_id)}
                        fullWidth
                        sx={{ marginTop: '10px' }}>
                        <InputLabel id="typeName">
                          <FormattedMessage id="typeName" />
                        </InputLabel>
                        <Select
                          labelId="typeName"
                          label={<FormattedMessage id="typeName" />}
                          id="typeName"
                          name="type_id"
                          fullWidth
                          value={values.type_id}
                          disabled={editData.op_external_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('type_id', u.target.value);
                            setTimeout(() => setFieldTouched('type_id', true));
                          }}>
                          {oppTypeList.map((oppType: any) => (
                            <MenuItem value={oppType.id} key={oppType.id}>
                              {oppType.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.type_id && touched.type_id ? (
                          <FormHelperText>{errors.type_id as string}</FormHelperText>
                        ) : null}
                      </FormControl>
                    </Grid>
                    <Grid item md={4}>
                      <Typography className="fieldHeader">
                        <FormattedMessage id="stageName" />
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <FormControl
                        error={Boolean(errors.stage_id && touched.stage_id)}
                        fullWidth
                        sx={{ marginTop: '10px' }}>
                        <InputLabel id="stageName">
                          <FormattedMessage id="stageName" />
                        </InputLabel>
                        <Select
                          labelId="stageName"
                          label={<FormattedMessage id="stageName" />}
                          id="stageName"
                          name="stage_id"
                          fullWidth
                          value={values.stage_id}
                          disabled={editData.op_external_id || isDisabledMode}
                          onChange={(u) => {
                            setFieldValue('stage_id', u.target.value);
                            setTimeout(() => setFieldTouched('stage_id', true));
                          }}>
                          {oppStageList.map((oppStage: any) => (
                            <MenuItem value={oppStage.id} key={oppStage.id}>
                              {oppStage.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.stage_id && touched.stage_id ? (
                          <FormHelperText>{errors.stage_id as string}</FormHelperText>
                        ) : null}
                      </FormControl>
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
                  <Box sx={{ marginTop: '10px', textAlign: 'right' }}>
                    <Button
                      sx={{ ...styles.dialogButton, marginRight: 2 }}
                      onClick={closeOpportunityDialog}>
                      <FormattedMessage id="back" />
                    </Button>
                    <Button
                      disabled={isSaving || editData.op_external_id}
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
                    <DealHub />
                    <br />
                    <Box sx={{ marginTop: '10px', textAlign: 'right' }}>
                      <Button
                        sx={{ ...styles.dialogButton, marginRight: 2 }}
                        onClick={closeOpportunityDialog}>
                        <FormattedMessage id="back" />
                      </Button>
                      <Button
                        disabled={isSaving || editData.op_external_id || isDisabledMode}
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

export default injectIntl(AddOpportunity);
