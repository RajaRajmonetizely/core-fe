import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  TextField,
  Typography,
} from '@mui/material';
import { Stack } from '@mui/system';
import { DataGrid } from '@mui/x-data-grid';
import { DesktopDateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Field, FieldArray, Form, Formik } from 'formik';
import { RadioGroup } from 'formik-mui';
import { DateTimePicker } from 'formik-mui-lab';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import ContractClient from '../../api/Contract/ContractAPI';
import DealDeskClient from '../../api/DealDesk/DealDeskAPI';
import PriceBookClient from '../../api/PriceBook/PricebookAPI';
import TemplateClient from '../../api/Template/TemplateAPIs';
import TenantsClient from '../../api/Tenant/TenantAPIs';
import OrgHierarchyClient from '../../api/UserOrg/UserOrg';
import UsersClient from '../../api/Users/UserAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setOpportunityData } from '../../store/deal_hub/dealHub.slice';
import {
  setDealTermsSchema,
  setSelectedOpportunity,
  setSelectedPricingBook,
  setSelectedQuote,
} from '../../store/pricing_calculator/pricingCalculator.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import commonStyle from '../../styles/commonStyle';
import styles from '../../styles/styles';
import FilterSection from './FilterSection';
import Preview from './Preview';
import getColumns from './constants';

const pageStyle = {
  paperContainer: {
    padding: '28px 26px',
  },
};

interface IProps {
  intl: any;
}

const DealHub: React.FC<IProps> = ({ intl }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dealHubFilters = useSelector((state: any) => state.dealHub.dealHubFilters);
  const dealTermsSchema = useSelector((state: any) => state.pricingCalculator.dealTermsSchema);
  const opportunityEditData = useSelector((state: any) => state.opportunity.editOpportunityData);
  const [users, setUsers] = useState<any>([]);
  const [priceBooks, setPriceBooks] = useState<any>([]);
  const [hierarchyList, setHierarchyList] = useState<any>([]);
  const [rows, setRows] = useState<any>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any>();
  const [openPreview, setOpenPreview] = useState<boolean>(false);
  const [contractId, setContractId] = useState<any>();
  const [pdfLink, setPdfLink] = useState<any>('');
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [previewSignerDetails, setPreviewSignerDetails] = useState<boolean>(false);
  const [signerDetails, setSignerDetails] = useState<any>();
  const [isDialogDisabled, setIsDialogDisabled] = useState<boolean>(true);
  const [documentSignerCount, setDocumentSignerCount] = useState<number>(0);
  const [openActionDialog, setOpenActionDialog] = useState<boolean>(false);

  useEffect(() => {
    getDealTermsSchema();
    getUsers();
    getPriceBooks();
    getHierarchy();
    getTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDealTermsSchema = () => {
    if (_.isEmpty(dealTermsSchema)) {
      TenantsClient.getDealTerms()
        .then((response) => {
          const responseObj = response.data.map((schema: any) => {
            if (schema.component === 'date-picker' && schema.initialValue) {
              schema.initialValue = new Date(schema.initialValue);
            }
            return schema;
          });
          const sc = {
            fields: [
              ...responseObj,
              {
                name: 'spy',
                component: 'autosave-spy',
              },
            ],
          };
          dispatch(setDealTermsSchema(sc));
        })
        .catch((e) => {
          console.error(e);
          setSnackBarValues({
            type: 'error',
            display: true,
            message: intl.formatMessage({ id: 'defaultTermsError' }),
          });
        });
    }
  };

  useEffect(() => {
    getDeals();
    // eslint-disable-next-line
  }, [dealHubFilters]);

  const getDeals = async () => {
    setRows([]);
    setIsDataLoading(true);
    const response = await DealDeskClient.getDeals(dealHubFilters);
    if (response.message === 'success') {
      setIsDataLoading(false);
      dispatch(setOpportunityData(response.data));
      const rowData: any = [];
      if (
        Object.keys(opportunityEditData).length !== 0 &&
        window.location.pathname !== '/deal-hub'
      ) {
        response.data.forEach((op: any) => {
          if (op.id === opportunityEditData.id) {
            op.quotes.forEach((q: any) => {
              rowData.push({
                id: q.quote_id,
                ...q,
                ...{
                  name: op.name,
                  owner_name: op.owner_name,
                  close_date: new Date(op.close_date).toDateString(),
                  template: q.contract_details.template_id,
                  contract_status: q.contract_details.contract_status || null,
                },
              });
            });
          }
        });
      } else {
        response.data.forEach((op: any) => {
          op.quotes.forEach((q: any) => {
            rowData.push({
              id: q.quote_id,
              ...q,
              ...{
                name: op.name,
                owner_name: op.owner_name,
                close_date: new Date(op.close_date).toDateString(),
                template: q.contract_details.template_id,
                contract_status: q.contract_details.contract_status || null,
              },
            });
          });
        });
      }
      setRows(rowData);
    } else {
      setIsDataLoading(false);
      console.error(response);
    }
  };

  const getUsers = async () => {
    setIsDataLoading(true);
    const resp = await UsersClient.getUsers();
    if (resp.data.length) {
      setUsers(resp.data);
    } else {
      console.error(resp);
    }
    setIsDataLoading(false);
  };

  const getPriceBooks = async () => {
    setIsDataLoading(true);
    const resp = await PriceBookClient.getPriceBooks();
    if (resp.message === 'success' && resp.data.length) {
      setPriceBooks(resp.data);
    } else {
      console.error(resp);
    }
    setIsDataLoading(false);
  };

  const getHierarchy = async () => {
    const resp = await OrgHierarchyClient.getOrgHierarchyStructure();
    if (resp.message === 'success' && resp.data.length) {
      setHierarchyList(resp.data);
    } else {
      console.error(resp);
    }
  };

  const getTemplates = () => {
    setIsDataLoading(true);
    setIsTemplateLoading(true);
    TemplateClient.getTemplates()
      .then((response) => {
        setTemplates(response.data);
        setIsDataLoading(false);
        setIsTemplateLoading(false);
      })
      .catch((e) => {
        setIsDataLoading(false);
        setIsTemplateLoading(false);
        console.error(e);
      });
  };

  const openQuotePage = (quoteId: string) => {
    dispatch(setSelectedOpportunity({}));
    dispatch(setSelectedPricingBook({}));
    dispatch(setSelectedQuote({}));
    navigate(`/pricing-calculator/${quoteId}`);
    dispatch(
      setSection({
        id: 7,
        name: 'pricingCalculator',
        route: '/pricing-calculator',
      }),
    );
  };

  const generateContractBasedOnTemplate = (id: string, quote: any): void => {
    setIsPdfLoading(true);
    ContractClient.generateContract(quote.quote_id, quote.template)
      .then((response: any) => {
        getDeals();
        if (response?.data?.s3_file_path) {
          setIsPdfLoading(false);
        }
      })
      .catch((e) => {
        setIsPdfLoading(false);
        console.error(e);
      });
    const index = rows.findIndex((row: any) => row.id === id);
    const data = [...rows];
    data.splice(index, 1, quote);
    setRows(data);
  };

  const isContractStatusInvalidForActions = (contractStatus: string | null) => {
    if (contractStatus === null) {
      return false;
    }
    return contractStatus === 'Cancelled' || contractStatus === undefined;
  };

  const isContractStatusValidForTemplateSelection = (contractStatus: string | null) => {
    return (
      contractStatus === 'Cancelled' || contractStatus === undefined || contractStatus === null
    );
  };

  const handleDialog = (rowValues: any) => {
    const signerCount = JSON.parse(rowValues.contract_details?.signer_count);
    if (signerCount) {
      setDocumentSignerCount(signerCount.total_signature_count);
    }
    setContractId(rowValues.contract_details.contract_id);
    setPreviewSignerDetails(false);
    if (rowValues.contract_details?.signer_details?.length) {
      setPreviewSignerDetails(true);
      const rowSignerDetails = {
        signees: rowValues.contract_details.signer_details,
        contractEndDateTime: dayjs(rowValues.contract_details.contract_expiry),
        maintainOrder: rowValues.contract_details.maintain_order_at,
      };
      setSignerDetails(rowSignerDetails);
    }
    setIsDialogDisabled(isSignerDetailsDisabled(rowValues.contract_details?.contract_status));
    setIsDialogOpen(true);
  };

  const isSignerDetailsDisabled = (status: string) => {
    if (['Draft', 'In Approval Process', 'Activated', 'Expired'].includes(status)) {
      return true;
    }
    return false;
  };

  const isRefreshButtonDisabled = (status: string) => {
    if (
      ['Draft', 'In Approval Process', 'Activated', 'Expired', 'Cancelled', undefined].includes(
        status,
      )
    ) {
      return true;
    }
    return false;
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setPreviewSignerDetails(false);
    setSignerDetails({});
  };

  const submit = (values: any) => {
    if (contractId) {
      if (!isFormValid(values)) {
        return;
      }
      if (values.signees.length !== documentSignerCount) {
        setIsSaving(false);
        setSnackBarValues({
          display: true,
          type: 'error',
          message: `This contract should have ${documentSignerCount} signees`,
        });
        return;
      }
      setIsSaving(true);
      const accountSignee: any[] = [];
      const customerSignee: any[] = [];
      values.signees.forEach((signee: any) => {
        if (signee.signer_type === 'account') {
          accountSignee.push({
            name: signee.signer_name,
            email_address: signee.signer_email_address,
          });
        } else {
          customerSignee.push({
            name: signee.signer_name,
            email_address: signee.signer_email_address,
          });
        }
      });
      if (!accountSignee.length) {
        setIsSaving(false);
        setSnackBarValues({
          display: true,
          type: 'error',
          message: 'Atleast 1 account signer is required',
        });
        return;
      }
      if (!customerSignee.length) {
        setIsSaving(false);
        setSnackBarValues({
          display: true,
          type: 'error',
          message: 'Atleast 1 customer signer is required',
        });
        return;
      }
      const requestObject = {
        title: '',
        subject: '',
        message: '',
        maintain_order_at: values.maintainOrder,
        expires_at: values.contractEndDateTime.$d,
        account_signers: accountSignee,
        customer_signers: customerSignee,
      };
      ContractClient.sendSignatureRequest(contractId, requestObject)
        .then(() => {
          getDeals();
          setIsSaving(false);
          handleClose();
          setSnackBarValues({
            display: true,
            type: 'success',
            message: 'Signature request sent successfully',
          });
        })
        .catch((e) => {
          setIsSaving(false);
          console.error(e);
        });
    } else {
      setSnackBarValues({ display: true, type: 'error', message: 'Contract Id not found.' });
    }
  };

  const isFormValid = (values: any) => {
    let isValid = true;
    const emailList: string[] = [];
    const outputList: string[] = [];
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    values.signees.forEach((signee: any) => {
      if (isValid) {
        if (regex.test(signee.signer_email_address)) {
          emailList.push(signee.signer_email_address);
        } else {
          isValid = false;
          setIsSaving(false);
          setSnackBarValues({
            display: true,
            type: 'error',
            message: 'Invalid Email Id',
          });
        }
      }
    });
    emailList.forEach((email) => {
      if (isValid) {
        if (!outputList.includes(email)) {
          outputList.push(email);
        } else {
          isValid = false;
          setIsSaving(false);
          setSnackBarValues({
            display: true,
            type: 'error',
            message: 'Duplicate Email Id',
          });
        }
      }
    });
    values.signees.forEach((signee: any) => {
      if (isValid) {
        if (signee.signer_name === '' || signee.signer_name === null) {
          isValid = false;
          setIsSaving(false);
          setSnackBarValues({
            display: true,
            type: 'error',
            message: 'Name is required',
          });
          return;
        }
        if (signee.signer_email_address === '' || signee.signer_email_address === null) {
          isValid = false;
          setIsSaving(false);
          setSnackBarValues({
            display: true,
            type: 'error',
            message: 'Email is required',
          });
          return;
        }
        if (signee.signer_type === '' || signee.signer_type === null) {
          isValid = false;
          setIsSaving(false);
          setSnackBarValues({
            display: true,
            type: 'error',
            message: 'Signer Type is required',
          });
        }
      }
    });
    return isValid;
  };

  const openPreviewWindow = (contract_id: any) => {
    setIsPdfLoading(true);
    ContractClient.getContractPDF(contract_id)
      .then((resp: any) => {
        if (resp.message === 'success') {
          setIsPdfLoading(false);
          setPdfLink(resp.data.presigned_url);
          setOpenPreview(true);
        }
      })
      .catch((e) => {
        setIsPdfLoading(false);
        console.error(e);
        setSnackBarValues({
          display: true,
          type: 'error',
          message: 'Error while loading contract preview. Please try again',
        });
      });
  };

  const cancelSignatureRequest = (contract_id: any) => {
    ContractClient.cancelSignatureRequest(contract_id)
      .then(() => {
        getDeals();
        setSnackBarValues({
          display: true,
          type: 'success',
          message: 'Signature request cancelled',
        });
      })
      .catch((error) => {
        console.error(error);
        setSnackBarValues({
          display: true,
          type: 'error',
          message: 'Failed while cancelling signature request. Try again',
        });
      });
  };

  const openActionPopUp = (contract_id: any) => {
    setContractId(contract_id);
    setOpenActionDialog(true);
  };

  const closeActionPopUp = () => {
    setOpenActionDialog(false);
    setContractId('');
  };

  const downloadSignedContract = () => {
    ContractClient.downloadSignedPDF(contractId)
      .then((response) => {
        setOpenActionDialog(false);
        const link = document.createElement('a');
        link.href = response.data.pre_signed_url;
        link.target = '_self';
        link.click();
      })
      .catch((error) => {
        setOpenActionDialog(true);
        console.error(error);
      });
  };

  const previewSignedContract = () => {
    setIsPdfLoading(true);
    setOpenActionDialog(false);
    ContractClient.downloadSignedPDF(contractId)
      .then((response) => {
        setIsPdfLoading(false);
        setPdfLink(response.data.pre_signed_url);
        setOpenPreview(true);
      })
      .catch((error) => {
        setOpenActionDialog(true);
        console.error(error);
        setIsPdfLoading(false);
        setSnackBarValues({
          display: true,
          type: 'error',
          message: 'Error while loading contract preview. Please try again',
        });
      });
  };

  return (
    <>
      <Box sx={window.location.pathname === '/deal-hub' ? commonStyle.bodyContainer : null}>
        <Paper sx={window.location.pathname === '/deal-hub' ? pageStyle.paperContainer : null}>
          {window.location.pathname === '/deal-hub' ? (
            <FilterSection
              users={users}
              priceBooks={priceBooks}
              hierarchyList={hierarchyList}
              loading={isDataLoading}
            />
          ) : null}
          <Box sx={{ width: '100%' }}>
            {window.location.pathname === '/deal-hub' ? (
              <DataGrid
                rows={isDataLoading || isTemplateLoading ? [] : rows}
                columns={getColumns(
                  intl,
                  templates,
                  openQuotePage,
                  generateContractBasedOnTemplate,
                  handleDialog,
                  openPreviewWindow,
                  cancelSignatureRequest,
                  isContractStatusInvalidForActions,
                  isContractStatusValidForTemplateSelection,
                  openActionPopUp,
                  isRefreshButtonDisabled,
                  false,
                )}
                density="comfortable"
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                  sorting: {
                    sortModel: [{ field: 'close_date', sort: 'desc' }],
                  },
                }}
                sx={commonStyle.dateGridStyle}
                pageSizeOptions={[10]}
                disableRowSelectionOnClick
                disableColumnMenu
                loading={isDataLoading || isTemplateLoading}
              />
            ) : (
              <DataGrid
                rows={isDataLoading || isTemplateLoading ? [] : rows}
                columns={getColumns(
                  intl,
                  templates,
                  openQuotePage,
                  generateContractBasedOnTemplate,
                  handleDialog,
                  openPreviewWindow,
                  cancelSignatureRequest,
                  isContractStatusInvalidForActions,
                  isContractStatusValidForTemplateSelection,
                  openActionPopUp,
                  isRefreshButtonDisabled,
                  true,
                )}
                getRowHeight={() => 'auto'}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 20,
                    },
                  },
                  sorting: {
                    sortModel: [{ field: 'close_date', sort: 'desc' }],
                  },
                  columns: {
                    columnVisibilityModel: {
                      name: false,
                      actions: false,
                      contract_status: false,
                      num_comments: false,
                      quote_status: false,
                    },
                  },
                }}
                sx={commonStyle.dateGridStyle}
                pageSizeOptions={[5]}
                disableRowSelectionOnClick
                disableColumnMenu
                loading={isDataLoading || isTemplateLoading}
              />
            )}
          </Box>
        </Paper>
      </Box>
      {openPreview && (
        <Preview open={openPreview} onClose={() => setOpenPreview(false)} pdf={pdfLink} />
      )}
      <Dialog open={isDialogOpen} maxWidth="lg">
        <DialogTitle>Signee Page</DialogTitle>
        <Formik
          initialValues={
            previewSignerDetails
              ? signerDetails
              : {
                  signees: [{ signer_name: '', signer_email_address: '', signer_type: '' }],
                  contractEndDateTime: '',
                  maintainOrder: 'none',
                }
          }
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={submit}
          validationSchema={Yup.object({
            contractEndDateTime: Yup.date().required('Date is required'),
          })}>
          {({ values, setFieldTouched, setFieldValue, handleSubmit }) => {
            return (
              <Form>
                <Field
                  component={DateTimePicker}
                  name="contractEndDateTime"
                  render={() => {
                    return (
                      <DialogContent dividers>
                        <Grid>
                          <Stack>
                            <Grid item md={4}>
                              <Typography className="dialogHeading">
                                <FormattedMessage id="contractExpiringOn" />
                                <span style={{ color: 'red' }}> *</span>
                              </Typography>
                              <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DesktopDateTimePicker
                                  label={intl.formatMessage({ id: 'dateTime' })}
                                  value={dayjs(values.contractEndDateTime)}
                                  slotProps={{
                                    actionBar: {
                                      actions: ['clear'],
                                    },
                                  }}
                                  disabled={isDialogDisabled}
                                  format="MM/DD/YYYY hh:mm:ss A"
                                  disablePast
                                  onChange={(newValue: any) => {
                                    setFieldValue('contractEndDateTime', newValue);
                                    setTimeout(() => setFieldTouched('contractEndDateTime', true));
                                  }}
                                />
                              </LocalizationProvider>
                            </Grid>
                          </Stack>
                        </Grid>
                      </DialogContent>
                    );
                  }}
                />
                <br />
                <DialogContent>
                  <FieldArray
                    name="signees"
                    render={(arrayHelpers) => {
                      const { signees } = values;
                      return (
                        <Grid>
                          <Stack>
                            <Grid item md={12}>
                              <Button
                                onClick={() =>
                                  arrayHelpers.push({
                                    signer_name: '',
                                    signer_email_address: '',
                                    signer_type: '',
                                  })
                                }>
                                <FormattedMessage id="addSigneeDetails" />
                              </Button>
                              <br />
                              <br />
                              <Stack direction="row">
                                <Typography width="290px" className="dialogHeading">
                                  <FormattedMessage id="name" />
                                  <span style={{ color: 'red' }}> *</span>
                                </Typography>
                                <Typography width="290px" className="dialogHeading">
                                  <FormattedMessage id="email" />
                                  <span style={{ color: 'red' }}> *</span>
                                </Typography>
                                <Typography width="290px" className="dialogHeading">
                                  <FormattedMessage id="signerType" />
                                  <span style={{ color: 'red' }}> *</span>
                                </Typography>
                              </Stack>
                              <Divider />
                              {signees.map((signee: any, index: any) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Stack direction="row" key={index}>
                                  <Field
                                    component={TextField}
                                    sx={{ margin: '20px 4px', width: '280px' }}
                                    label={intl.formatMessage({ id: 'name' })}
                                    id="name"
                                    name={`signees.${index}.signer_name`}
                                    variant="outlined"
                                    disabled={isDialogDisabled}
                                    value={signee.signer_name}
                                    onChange={(u: any) => {
                                      setFieldValue(`signees.${index}.signer_name`, u.target.value);
                                      setTimeout(() =>
                                        setFieldTouched(`signees.${index}.signer_name`, true),
                                      );
                                    }}
                                  />
                                  <Field
                                    component={TextField}
                                    sx={{ margin: '20px 4px', width: '280px' }}
                                    label={intl.formatMessage({ id: 'email' })}
                                    id="email"
                                    name={`signees.${index}.signer_email_address`}
                                    variant="outlined"
                                    disabled={isDialogDisabled}
                                    value={signee.signer_email_address}
                                    onChange={(u: any) => {
                                      setFieldValue(
                                        `signees.${index}.signer_email_address`,
                                        u.target.value,
                                      );
                                      setTimeout(() =>
                                        setFieldTouched(
                                          `signees.${index}.signer_email_address`,
                                          true,
                                        ),
                                      );
                                    }}
                                  />
                                  <Field
                                    component={TextField}
                                    select
                                    sx={{ margin: '20px 4px', width: '280px' }}
                                    label={intl.formatMessage({ id: 'type' })}
                                    id="type"
                                    name={`signees.${index}.signer_type`}
                                    variant="outlined"
                                    disabled={isDialogDisabled}
                                    value={signee.signer_type}
                                    isClearable
                                    onChange={(u: any) => {
                                      setFieldValue(`signees.${index}.signer_type`, u.target.value);
                                      setTimeout(() =>
                                        setFieldTouched(`signees.${index}.signer_type`, true),
                                      );
                                    }}>
                                    <MenuItem value="account" key={1}>
                                      <FormattedMessage id="accountSigner" />
                                    </MenuItem>
                                    <MenuItem value="customer" key={2}>
                                      <FormattedMessage id="customerSigner" />
                                    </MenuItem>
                                  </Field>
                                  <Box sx={{ margin: '34px 17px 34px 15px' }}>
                                    <IconButton>
                                      <DeleteIcon onClick={() => arrayHelpers.remove(index)} />
                                    </IconButton>
                                  </Box>
                                </Stack>
                              ))}
                            </Grid>
                          </Stack>
                        </Grid>
                      );
                    }}
                  />
                  <br />
                  <Stack direction="row">
                    <Field
                      component={RadioGroup}
                      name="maintainOrder"
                      row
                      defaultValue="none"
                      value={values.maintainOrder}
                      onChange={(u: any) => {
                        setFieldValue('maintainOrder', u.target.value);
                        setTimeout(() => setFieldTouched('maintainOrder', true));
                      }}>
                      <FormControlLabel
                        value="both"
                        label="Maintain Order for Both"
                        disabled={isDialogDisabled}
                        control={<Radio />}
                      />
                      <FormControlLabel
                        value="account"
                        label="Maintain Account Signee Order"
                        disabled={isDialogDisabled}
                        control={<Radio />}
                      />
                      <FormControlLabel
                        value="customer"
                        label="Maintain Customer Signee Order"
                        disabled={isDialogDisabled}
                        control={<Radio />}
                      />
                      <FormControlLabel
                        value="none"
                        label="None"
                        control={<Radio />}
                        disabled={isDialogDisabled}
                      />
                    </Field>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button sx={styles.dialogButton} onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                  </Button>
                  <Button
                    sx={styles.dialogButton}
                    onClick={() => handleSubmit()}
                    disabled={isDialogDisabled}>
                    {isSaving ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : (
                      <FormattedMessage id="sendForSignIn" />
                    )}
                  </Button>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>
      <Dialog open={openActionDialog}>
        <DialogTitle>Choose Action</DialogTitle>
        <DialogContent>
          <List>
            <ListItem disableGutters>
              <ListItemButton autoFocus onClick={downloadSignedContract}>
                <ListItemAvatar>
                  <Avatar>
                    <FileDownloadIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary="Download Signed Contract" />
              </ListItemButton>
            </ListItem>
            <ListItem disableGutters>
              <ListItemButton autoFocus onClick={previewSignedContract}>
                <ListItemAvatar>
                  <Avatar>
                    <PictureAsPdfIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary="Preview Signed Contract" />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionPopUp}>Close</Button>
        </DialogActions>
      </Dialog>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isPdfLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
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
export default injectIntl(DealHub);
