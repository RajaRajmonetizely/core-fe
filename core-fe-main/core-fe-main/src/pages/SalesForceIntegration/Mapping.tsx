import { Box, Button, CircularProgress, FormControl, Paper } from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import SalesForceClient from '../../api/SalesForce/SalesForceAPIs';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setRefetchData } from '../../store/salesforce/salesforce.slice';
import commonStyle from '../../styles/commonStyle';
import MappingGrid from './MappingGrid';
import getColumns from './constants';
import pageStyle from './pageStyle';

interface IProps {
  intl: any;
  mappingName: string;
  mappingKey: string;
  params: { sobject: string; db_model: string };
}

const Mapping: React.FC<IProps> = ({ intl, mappingName, mappingKey, params }) => {
  const dispatch = useDispatch();
  const mappedData = useSelector((state: any) => state.salesForce.salesforceMapping);
  const refetchData = useSelector((state: any) => state.salesForce.refetchData);
  const [salesforceFields, setSalesforceFields] = useState<any>([]);
  const [monetizelyFields, setMonetizelyFields] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(false);
  const [allFieldsData, setAllFieldsData] = useState<any>([]);
  const [sectionData, setSectionData] = useState<any>({});
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [roles, setRoles] = useState<any>([]);
  const [selectRoles, setSelectedRoles] = useState<any>([]);
  const [date, setDate] = useState<any>(null);
  const handleChange = (id: string, value: any) => {
    const index = allFieldsData.findIndex((f: any) => f.id === id);
    const d = [...allFieldsData];
    d.splice(index, 1, value);
    setAllFieldsData(d);
  };

  useEffect(() => {
    if (mappingName === 'User') {
      getUserRoles();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    getListing();
    // eslint-disable-next-line
  }, [mappedData]);

  useEffect(() => {
    if (mappingName === 'User' && roles.length) {
      const mappingOb = mappedData.find((d: any) => d.name === mappingName);
      if (mappingOb) {
        setSelectedRoles(
          mappingOb.config.map((k: any) => {
            return roles.find((r: any) => r.id === k);
          }),
        );
      }
    }
    // eslint-disable-next-line
  }, [roles]);

  const getUserRoles = async () => {
    setIsLoadingRoles(true);
    const resp = await SalesForceClient.getSalesforceRoles();
    if (resp.message === 'success') {
      setRoles(resp.data);
      setIsLoadingRoles(false);
    } else {
      setIsLoadingRoles(false);
    }
  };

  const getListing = async () => {
    setIsLoading(true);
    const mappingParams = `sobject=${params.sobject}&db_model=${params.db_model}`;
    const resp = await SalesForceClient.getSalesforceMappingObjectList(mappingParams);
    if (resp.message === 'success') {
      setMonetizelyFields(resp.data.db_fields);
      setSalesforceFields(resp.data.sf_fields);
      const data: any = [];
      const mappingOb = mappedData.find((d: any) => d.name === mappingName);
      if (mappingOb) {
        setSectionData(mappingOb);
        mappingOb.sf_column_mapping.forEach((m: any) => {
          const d = data.findIndex((i: any) => i.salesforceField === m.Destination_Field__c);
          if (d !== -1) {
            data[d] = {
              ...data[d],
              ...{
                integrateFromSalesforce: true,
                integrateToSalesforce: true,
              },
            };
          } else data.push(getObValue(m.Source_Field__c, m.Destination_Field__c, true, false));
        });
        mappingOb.m_column_mapping.forEach((m: any) => {
          const d = data.findIndex((i: any) => i.monetizelyField === m.Source_Field__c);
          if (d !== -1) {
            data[d] = {
              ...data[d],
              ...{
                integrateFromSalesforce: true,
                integrateToSalesforce: true,
              },
            };
          } else data.push(getObValue(m.Destination_Field__c, m.Source_Field__c, false, true));
        });
        if (mappingName === 'Opportunity') {
          setDate(mappingOb.config ? mappingOb.config[0].CreatedDate : null);
        }
      }
      const emptyFieldLength = resp.data.sf_fields.length - data.length;
      const ar = Array.from(Array(emptyFieldLength));
      ar.forEach(() => {
        data.push(getObValue('', '', true, false));
      });
      setAllFieldsData(data);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const getObValue = (
    salesforceField: string,
    monetizelyField: string,
    integrateFromSalesforce: boolean,
    integrateToSalesforce: boolean,
  ) => {
    return {
      id: uuidv4(),
      salesforceField,
      monetizelyField,
      integrateFromSalesforce,
      integrateToSalesforce,
    };
  };

  const getPostObData = () => {
    const sfColumnMapping: any = [];
    const mColumnMapping: any = [];
    allFieldsData.forEach((f: any) => {
      if (f.monetizelyField && f.salesforceField) {
        if (f.integrateFromSalesforce) {
          const ob = {
            Destination_Field__c: f.monetizelyField,
            Source_Field__c: f.salesforceField,
          };
          sfColumnMapping.push(ob);
        }
        if (f.integrateToSalesforce) {
          const ob = {
            Destination_Field__c: f.salesforceField,
            Source_Field__c: f.monetizelyField,
          };
          mColumnMapping.push(ob);
        }
      }
    });
    let config = [];
    if (mappingName === 'User') {
      config = selectRoles.map((k: any) => k.id);
    } else if (mappingName === 'Opportunity') {
      config =
        date && date !== 'Invalid Date' ? [{ CreatedDate: dayjs(date).format('YYYY-MM-DD') }] : [];
    }
    return {
      name: mappingName,
      sf_column_mapping: sfColumnMapping,
      m_column_mapping: mColumnMapping,
      config: config.length ? config : null,
    };
  };

  const handleSubmit = async () => {
    const postOb = getPostObData();
    setIsSaving(true);

    if (sectionData?.id) {
      const resp = await SalesForceClient.updateSalesforceMappingObject(sectionData.id, postOb);
      if (resp.message === 'success') {
        setIsSaving(false);
        dispatch(setRefetchData(true));
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'updateMappingSuccess' }),
        });
      }
    } else {
      const resp = await SalesForceClient.saveSalesforceMappingObject(postOb);
      if (resp.message === 'success') {
        setIsSaving(false);
        dispatch(setRefetchData(true));
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'saveMappingSuccess' }),
        });
      }
    }
  };

  const getFilteredMappingFields = (fields: any, key: string) => {
    const list = [...fields].filter((sf: any) => {
      if (allFieldsData.some((s: any) => s[key] === sf)) return false;
      return true;
    });
    return list;
  };

  return (
    <>
      <Box>
        <Paper sx={pageStyle.inputContainer}>
          <Box sx={pageStyle.cardTitle}>{intl.formatMessage({ id: mappingKey })}</Box>
          {mappingName === 'User' ? (
            <Box>
              <FormControl sx={{ m: 1, minWidth: 245, marginBottom: '20px' }}>
                <SearchAddAutocomplete
                  loading={isLoadingRoles}
                  caption="userRoles"
                  data={roles}
                  multiselect
                  showAddOption={false}
                  selectedItem={selectRoles}
                  setSelectedData={setSelectedRoles}
                  showSelectionValue
                />
              </FormControl>
            </Box>
          ) : null}
          {mappingName === 'Opportunity' ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DesktopDatePicker
                label={<FormattedMessage id="cutOffDate" />}
                value={date && dayjs(date)}
                sx={{ marginTop: '10px', marginBottom: '20px' }}
                defaultValue={null}
                slotProps={{ actionBar: { actions: ['clear'] } }}
                format="MM/DD/YYYY"
                onChange={(u: any) => {
                  setDate(u);
                }}
              />
            </LocalizationProvider>
          ) : null}
          <Box sx={{ height: '600px', width: '100%' }}>
            <MappingGrid
              rows={allFieldsData}
              columns={getColumns(
                intl,
                getFilteredMappingFields(salesforceFields, 'salesforceField'),
                getFilteredMappingFields(monetizelyFields, 'monetizelyField'),
                handleChange,
              )}
              loading={refetchData || isLoading}
            />
          </Box>
          <Button onClick={() => handleSubmit()} sx={{ mt: 3, mb: 2, ...commonStyle.button }}>
            {isSaving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              intl.formatMessage({ id: sectionData?.id ? 'update' : 'save' })
            )}
          </Button>
        </Paper>
      </Box>
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

export default injectIntl(Mapping);
