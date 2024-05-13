/* eslint-disable */
import { Box, Button, CircularProgress, Tab, Tabs } from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import * as Yup from 'yup';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import DialogBox from '../../components/DialogBox/DialogBox';
import PricingStructureTable from '../../components/PricingStructureTable/PricingStructureTable';
import SaveInput from '../../components/SaveInput/SaveInput';
import Snackbar from '../../components/Snackbar/Snackbar';
import { getColumnFields } from '../../constants/dialogBoxConstants';
import { rangeColumns } from '../../mocks/coreModel';
import { ISnackBar } from '../../models/common';
import { ITier } from '../../models/plan';
import {
  ICoreData,
  ICoreDetails,
  IMetrics,
  IPricingColumn,
  IPricingStructure,
} from '../../models/pricing-model';
import {
  setCoreTierDetails,
  setModelDetails,
  setPricingCurveModel,
  setRowData,
  setSelectedColumns,
  // setCoreTierDetails,
  setSelectedPriceMetric,
  setSelectedPriceStructure,
  setSelectedPricingModel,
  setSimulationTierwiseRowData,
  updatePricingModel,
} from '../../store/pricing_model/pricingModel.slice';
import commonStyle from '../../styles/commonStyle';
import styles from '../../styles/styles';
import { REGEX } from '../../utils/helperService';
import { getTokens } from '../../utils/lexar';
import { ErrorType, ValidationError } from '../../utils/types';
import { getValidationErrors } from '../../utils/validator';
import MetricDialog from './MetricDialog';
import SelectionSection from './SelectionSection';

const componentStyle = {
  btnContainer: {
    textAlign: 'right',
    marginTop: '18px',
  },
};

interface IProps {
  intl: any;
}

const CoreModel: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const { modelId } = useParams();
  const navigate = useNavigate();
  const ability = useSelector((state: any) => state.auth.ability);
  const [showLoader, setLoader] = useState(false);
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [versionName, setVersionName] = useState('');
  const selectedPriceMetric = useSelector((state: any) => state.pricingModel.selectedPriceMetric);
  const coreData = useSelector((state: any) => state.pricingModel.coreTierDetails);
  const selectedPriceStructure = useSelector(
    (state: any) => state.pricingModel.selectedPriceStructure,
  );
  const pricingStructure = useSelector((state: any) => state.pricingModel.pricingStructure);
  const [modelVersionLoader, setModelVersionLoader] = useState(false);
  const selectedPricingModel = useSelector((state: any) => state.pricingModel.selectedPricingModel);
  const simulationPricingModel = useSelector(
    (state: any) => state.pricingModel.simulationPricingModel,
  );
  const selectedColumns = useSelector((state: any) => state.pricingModel.selectedColumns);
  const [isOpen, setOpen] = useState(false);
  const [columnData, setColumnData] = useState<any>('');
  const [isEdit, setIsEdit] = useState(false);
  const [openMetricDialog, setOpenMetricDialog] = useState(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [coreTierDetails, setCoreDetails] = useState<ICoreDetails[]>([]);
  const modelDetails = useSelector((state: any) => state.pricingModel.modelDetails);
  const pricingModels = useSelector((state: any) => state.pricingModel.pricingModels);
  const [errorStr, setErrorStr] = useState<string>('');
  const [metricColumns, setMetricColumns] = useState([]);

  useEffect(() => {
    onSetPricingModelVersion(modelDetails.id);
    // eslint-disable-next-line
  }, [modelDetails, pricingModels]);

  useEffect(() => {
    onSelectPricingStructure(modelDetails.pricing_structure_id);
    // eslint-disable-next-line
  }, [modelDetails, pricingStructure]);

  useEffect(() => {
    onSetPricingMetric(modelDetails.metric_details);
    // eslint-disable-next-line
  }, [modelDetails]);

  useEffect(() => {
    if (selectedColumns.length > 0) {
      const chidArray: any = [];
      selectedColumns.map((item: any) => {
        chidArray.push(item);
        return '';
      });
      dispatch(setRowData(chidArray));
    }
    // eslint-disable-next-line
  }, [selectedColumns]);

  useEffect(() => {
    if (selectedPriceMetric && selectedPriceMetric.length > 1) {
      const filterData = pricingStructure.filter(
        (item: IPricingStructure) => item.name === 'Custom',
      );
      if (filterData && filterData.length > 0) {
        dispatch(setSelectedPriceStructure(filterData[0]));
      }
    }
    // eslint-disable-next-line
  }, [selectedPriceMetric, pricingStructure]);

  useEffect(() => {
    setCoreDetails(coreData);
  }, [coreData]);

  useEffect(() => {
    if (selectedPriceStructure && selectedPriceStructure.details) {
      dispatch(setSelectedColumns(selectedPriceStructure.details));
    }
    // eslint-disable-next-line
  }, [selectedPriceStructure]);

  const onSetPricingMetric = (value: any) => {
    if (modelDetails?.id && value.length < 4) {
      dispatch(setSelectedPriceMetric(value));
    } else {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'priceMetricLimit' }),
      });
    }
  };

  const onSetPricingModelVersion = (value: any) => {
    if (modelDetails?.id && pricingModels && pricingModels.length > 0 && value) {
      const filterData = pricingModels.filter((item: any) => item.id === value);
      if (filterData && filterData.length > 0) {
        navigate(`/plans/pricing-model/${filterData[0].id}`, {
          state: { modelName: filterData[0].name },
        });
        dispatch(setSelectedPricingModel(filterData[0]));
        if (simulationPricingModel?.id !== selectedPricingModel.id) {
          dispatch(setSimulationTierwiseRowData({}));
        }
      }
    }
  };

  const onSelectPricingStructure = (value: any) => {
    if (modelDetails?.id && pricingStructure && pricingStructure.length > 0 && value) {
      const filterData = pricingStructure.filter((item: any) => item.id === value);
      if (filterData && filterData.length > 0) {
        dispatch(setSelectedPriceStructure(filterData[0]));
      }
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const addNewRow = () => {
    const tempArray = generateCoreArray();
    tempArray[selectedTab].core.values.push({});
    dispatch(setCoreTierDetails(tempArray));
  };

  const openPopup = () => {
    setOpen(true);
  };

  const closePopup = () => {
    setOpen(false);
    setIsEdit(false);
    setColumnData('');
  };

  const generateCoreArray = () => {
    const json = JSON.stringify(coreTierDetails);
    return JSON.parse(json);
  };

  const addNewColumn = (data: any) => {
    const tempArray = generateCoreArray();
    tempArray[selectedTab].core.columns.push(data);
    const inputColumns: any = [];
    const outputColumns: any = [];
    tempArray[selectedTab].core.columns.map((item: any) => {
      if (item.is_output_column || item.is_intermediate_column) {
        outputColumns.push(item);
      } else {
        inputColumns.push(item);
      }
    });
    tempArray[selectedTab].core.columns = inputColumns.concat(outputColumns);
    setIsEdit(false);
    dispatch(setCoreTierDetails(tempArray));
  };

  const removeNewColumn = (data: any) => {
    const tempArray = generateCoreArray();
    const findIndex = tempArray[selectedTab].core.columns.findIndex(
      (item: any) => item.id === data.id,
    );
    if (findIndex > -1) {
      tempArray[selectedTab].core.columns.splice(findIndex, 1);
    }
    setIsEdit(false);
    dispatch(setCoreTierDetails(tempArray));
  };

  const onDeleteRow = (index: number) => {
    const tempArray = generateCoreArray();
    tempArray[selectedTab].core.values.splice(index, 1);
    setIsEdit(false);
    dispatch(setCoreTierDetails(tempArray));
  };

  const updateColumn = (data: any) => {
    const tempArray = generateCoreArray();
    const findIndex = tempArray[selectedTab].core.columns.findIndex((item: any) => {
      return item.id === data.id;
    });
    delete data.outputFormulaValue;
    if (findIndex > -1) {
      tempArray[selectedTab].core.columns[findIndex] = data;
    }
    setIsEdit(false);
    dispatch(setCoreTierDetails(tempArray));
  };

  const onEdit = (item: any) => {
    const json = JSON.stringify(item);
    const tempItem = JSON.parse(json);
    setColumnData(tempItem);
    setIsEdit(true);
    openPopup();
  };

  const saveColumn = (dynamicColumnData: IPricingColumn = {} as IPricingColumn) => {
    if (columnData.name || dynamicColumnData.name) {
      const trimName = dynamicColumnData.name
        ? dynamicColumnData.name.trim()
        : columnData.name.trim();
      const columnKey = trimName.replaceAll(' ', '_').toLowerCase();
      if (isEdit) {
        updateColumn({
          ...columnData,
          formula: dynamicColumnData.outputFormulaValue ?? columnData.formula ?? null,
          name: trimName,
          key: columnKey,
        });
      } else {
        const body = {
          ...columnData,
          ...dynamicColumnData,
          name: trimName,
          key: columnKey,
          id: uuidv4(),
          formula: dynamicColumnData.outputFormulaValue ?? columnData.formula ?? null,
          ...getColumnType(dynamicColumnData),
          custom: true,
        };
        delete body.outputFormulaValue;
        addNewColumn(body);
      }
    }
    closePopup();
  };

  const onTextChange = (value: any, rowIndex: number, column: any, subKey?: string) => {
    const json = JSON.stringify(coreTierDetails);
    const tempArray = JSON.parse(json);
    if (subKey) {
      if (!tempArray[selectedTab].core.values[rowIndex][column.key]) {
        tempArray[selectedTab].core.values[rowIndex][column.key] = {};
      }
      tempArray[selectedTab].core.values[rowIndex][column.key][subKey] = value;
    } else {
      tempArray[selectedTab].core.values[rowIndex][column.key] = value;
    }
    dispatch(setCoreTierDetails(tempArray));
  };

  const getColumnType = (dynamicColumnData: any) => {
    return {
      is_input_column:
        dynamicColumnData.columnType === 'normal' ||
        columnData.columnType === 'normal' ||
        dynamicColumnData.columnType === 'upto' ||
        columnData.columnType === 'upto',
      is_upto_column: dynamicColumnData.columnType === 'upto' || columnData.columnType === 'upto',
      is_intermediate_column:
        dynamicColumnData.columnType === 'intermediate' || columnData.columnType === 'intermediate',
      is_unit_column:
        columnData.config === 'unitColumn' || dynamicColumnData.columnType === 'unitColumn',
      is_metric_column:
        dynamicColumnData.columnType === 'range' || columnData.columnType === 'range',
      is_output_column:
        dynamicColumnData.columnType === 'output' || columnData.columnType === 'output',
      width:
        dynamicColumnData.columnType === 'range' || columnData.columnType === 'range' ? 392 : 300,
      sub_columns:
        dynamicColumnData.columnType === 'range' || columnData.columnType === 'range'
          ? rangeColumns
          : [],
    };
  };

  const validateField = () => {
    let isValidate = true;
    if (selectedPriceMetric.length === 0) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseSelectMetric' }),
      });
      isValidate = false;
      return false;
    }
    if (!selectedPriceStructure.id) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseSelectStructure' }),
      });
      isValidate = false;
      return false;
    }
    const tempDetails = JSON.parse(JSON.stringify(coreTierDetails));

    tempDetails[selectedTab].core.values.map((row: any) => {
      if (isValidate) {
        tempDetails[selectedTab].core.columns.map((col: any) => {
          if (isValidate) {
            if (col.sub_columns.length > 0 && col.pastHighValue === undefined) {
              col.pastHighValue = 0;
            }
            if (
              row[col.key] === undefined &&
              !col.is_output_column &&
              !col.is_intermediate_column
            ) {
              isValidate = false;
              setSnackBarValues({
                display: true,
                type: 'error',
                message: `Please enter ${col.key} value`,
              });
            } else if (
              Number(row[col.key]) < 0 &&
              !col.is_output_column &&
              !col.is_intermediate_column
            ) {
              isValidate = false;
              setSnackBarValues({
                display: true,
                type: 'error',
                message: `Please enter positive values for ${col.key} value`,
              });
            } else if (col.sub_columns.length > 0 && row[col.key]) {
              col.sub_columns.map((subData: any) => {
                if (row[col.key][subData.key] === undefined) {
                  isValidate = false;
                  setSnackBarValues({
                    display: true,
                    type: 'error',
                    message: `Please enter ${subData.key} value of ${col.key}`,
                  });
                }
                if (Number(row[col.key][subData.key]) < 0) {
                  isValidate = false;
                  setSnackBarValues({
                    display: true,
                    type: 'error',
                    message: `Please enter positive values for ${subData.key} value of ${col.key}`,
                  });
                }
                return null;
              });
              if (isValidate && col.sub_columns.length > 1) {
                // eslint-disable-next-line
                if (
                  Number(row[col.key][col.sub_columns[0].key]) >
                  Number(row[col.key][col.sub_columns[1].key])
                ) {
                  isValidate = false;
                  setSnackBarValues({
                    display: true,
                    type: 'error',
                    message: intl.formatMessage({ id: 'lowMessage' }),
                  });
                }
              }
              if (
                col.pastHighValue &&
                isValidate &&
                Number(row[col.key][col.sub_columns[0].key]) < col.pastHighValue
              ) {
                isValidate = false;
                setSnackBarValues({
                  display: true,
                  type: 'error',
                  message: intl.formatMessage({ id: 'rangeMessage' }),
                });
              }
              if (isValidate && col.sub_columns.length > 1) {
                col.pastHighValue = Number(row[col.key][col.sub_columns[1].key]);
              }
            }
          }
          return null;
        });
      }
      return null;
    });
    const filterOutput = tempDetails[selectedTab].core.columns.filter(
      (item: any) => item.is_output_column,
    );
    if (filterOutput.length > 0) {
      filterOutput.map((outputCol: any) => {
        if (isValidate) {
          if (!outputCol.formula) {
            isValidate = false;
            setSnackBarValues({
              display: true,
              type: 'error',
              message: intl.formatMessage({ id: 'pleaseEnterFinalFormula' }),
            });
          }
        }
        return null;
      });
    } else {
      isValidate = false;
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseEnterOutputColumn' }),
      });
    }
    return isValidate;
  };

  const saveCoreModel = async () => {
    try {
      if (validateField()) {
        setLoader(true);
        const body: ICoreData = {} as ICoreData;
        body.metric_details = selectedPriceMetric.map((metricData: IMetrics) => metricData.id);
        body.pricing_structure_id = selectedPriceStructure.id;
        body.details = JSON.parse(JSON.stringify(coreTierDetails));
        body.details.forEach((detail) => {
          if (detail.addons) {
            detail.addons.forEach((adb) => {
              if (adb.is_custom_metric && adb.metric_details) {
                adb.metric_details = adb.metric_details.map((metric) => metric.id || metric);
              }
            });
          }
        });
        const response = await PricingModelClient.updateModelData(modelId as string, body);
        if (response.message === 'success') {
          const modelResponse = await PricingModelClient.getDetailsByModelId(modelId as string);
          if (modelResponse.message === 'success') {
            dispatch(setModelDetails(modelResponse.data));
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'dataSaved' }),
            });
            setLoader(false);
          }
        } else {
          setLoader(false);
        }
      }
    } catch (e) {
      setLoader(false);
    }
    return null;
  };

  const clonePricingModel = async () => {
    try {
      if (validateSaveAsInput()) {
        setModelVersionLoader(true);
        const response = await PricingModelClient.createPricingModel(
          {
            name: versionName,
            package_id: selectedPricingModel.id,
          },
          modelId as string,
        );
        if (response.message === 'success') {
          dispatch(setSelectedPricingModel(response.data));
          dispatch(updatePricingModel(response.data));
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'clonePricingModel' }),
            type: 'success',
          });
          navigate(`/plans/pricing-model/${response.data.id}`, {
            state: {
              modelName: response.data.name,
            },
          });
        }
        setModelVersionLoader(false);
      }
    } catch (e) {
      setModelVersionLoader(false);
    }
  };

  const validateSaveAsInput = () => {
    let isValid = true;
    if (versionName && !REGEX.test(versionName)) {
      isValid = false;
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'valueWithSpecialCharacters' }),
      });
      return isValid;
    }
    if (versionName.trim() === '') {
      isValid = false;
      setSnackBarValues({
        display: true,
        message: intl.formatMessage({ id: 'cloneNameMissing' }),
        type: 'error',
      });
      return isValid;
    }
    if (pricingModels.some((pricingModel: any) => pricingModel.name === versionName)) {
      isValid = false;
      setSnackBarValues({
        display: true,
        message: intl.formatMessage({ id: 'pricingModelVersionAlreadyExists' }),
        type: 'error',
      });
      return isValid;
    }
    return isValid;
  };

  const getErrorString = (error: ValidationError, invalidCharacter: string): string => {
    if (error?.message) {
      return error.message;
    }
    if (invalidCharacter !== '') {
      return `Invalid '${invalidCharacter}'`;
    }
    return `${error.errorType} '${error?.token?.value}'`;
  };

  const validateOutputFormula = (values: any) => {
    const tokens = getTokens(values);
    const columnsKeys = coreTierDetails[selectedTab]?.core?.columns.map((item) => item.key);
    const errors = getValidationErrors(tokens, columnsKeys);
    let errorString = '';
    let invalidCharacter = '';
    for (let i = 0; i < errors.length; i++) {
      if (errors[i].errorType === ErrorType.InvalidCharacter) {
        while (i < errors.length && errors[i].errorType === ErrorType.InvalidCharacter) {
          invalidCharacter += errors[i]?.token?.value;
          i++;
        }
      }
      errorString += getErrorString(errors[i], invalidCharacter);
      invalidCharacter = '';
      if (i < errors.length - 1) {
        errorString += ' , ';
      }
    }
    setErrorStr(errorString);
    return !errorString;
  };

  const handleMetricColumn = (selectedStructure: any, selectedMetrics: any) => {
    if (selectedStructure.name === 'Custom' || selectedMetrics.length > 1) {
      let currentColumns: any = [];
      const tempArray = generateCoreArray();
      coreTierDetails.forEach((details, i) => {
        const columns: any = [];
        details.core.columns.forEach((col) => {
          if (col.metric_id) {
            const findIndex = selectedMetrics.findIndex(
              (metric: any) => metric.id === col.metric_id,
            );
            if (findIndex > -1) {
              columns.push(col);
            }
          } else {
            columns.push(col);
          }
        });
        if (i === selectedTab) {
          currentColumns = [...columns];
        }
        tempArray[i].core.columns = columns;
      });
      dispatch(setCoreTierDetails(tempArray));
      if (
        (selectedStructure.name === 'Custom' && selectedMetrics?.length === 1) ||
        selectedMetrics?.length > 1
      ) {
        let showColumnModal = false;
        const array: any = [];
        selectedMetrics.map((metric: IMetrics) => {
          const findIndex = currentColumns.findIndex((col: any) => col.metric_id === metric.id);
          if (findIndex === -1) {
            showColumnModal = true;
            array.push(metric);
          }
          return null;
        });
        setMetricColumns(array);
        if (showColumnModal && selectedMetrics.length < 4) {
          setOpenMetricDialog(true);
        }
      }
    }
  };

  const addMetricColumn = () => {
    setOpenMetricDialog(false);
    const tempArray = generateCoreArray();
    metricColumns.forEach((col: any) => {
      const trimName = col.name.trim();
      const columnKey = trimName.replaceAll(' ', '_').toLowerCase();
      const body = {
        metric_id: col.id,
        name: trimName,
        key: columnKey,
        columnType: col.columnType,
        id: col.id,
        ...getColumnType(col),
        custom: true,
      };
      tempArray.map((details: any) => {
        if (details?.core?.columns) {
          details.core.columns.push(body);
          const inputColumns: any = [];
          const outputColumns: any = [];
          details.core.columns.map((item: any) => {
            if (item.is_output_column || item.is_intermediate_column) {
              outputColumns.push(item);
            } else {
              inputColumns.push(item);
            }
          });
          details.core.columns = inputColumns.concat(outputColumns);
        }
      });
    });
    dispatch(setCoreTierDetails(tempArray));
  };

  return (
    <>
      <SelectionSection
        priceMetric={selectedPriceMetric}
        priceModelVersion={selectedPricingModel}
        priceStructure={selectedPriceStructure}
        setPriceMetric={(value: any) => {
          handleMetricColumn(selectedPriceStructure, value);
          onSetPricingMetric(value);
        }}
        setPricingModelVersion={(value: any) => {
          onSetPricingModelVersion(value?.id);
        }}
        setPricingStructure={(value: any) => {
          if (value.name === 'Custom') {
            dispatch(setSelectedPriceMetric([]));
          }
          onSelectPricingStructure(value?.id);
        }}
      />

      {(selectedPriceStructure.id && selectedPriceMetric.id) ||
      (coreTierDetails && coreTierDetails.length > 0) ? (
        <>
          <Tabs
            value={selectedTab}
            onChange={handleChange}
            textColor="secondary"
            sx={{ marginTop: '8px' }}
            indicatorColor="secondary">
            {selectedPricingModel.details?.map((t: ITier) => {
              return (
                <Tab
                  key={t.tier_id}
                  label={t.tier_name}
                  sx={{ borderBottom: '2px solid  #C3C3CF', ...styles.tabLabelStyle }}
                />
              );
            })}
          </Tabs>
          {coreTierDetails[selectedTab]?.core ||
          (selectedPriceStructure.id && selectedPriceMetric.id) ? (
            <PricingStructureTable
              onAddColumn={openPopup}
              onAddRow={addNewRow}
              onEdit={onEdit}
              selectedPricingStructure={selectedPriceStructure}
              onDelete={removeNewColumn}
              onTextChange={onTextChange}
              onDeleteRow={onDeleteRow}
              rows={coreTierDetails[selectedTab]?.core?.values ?? []}
              columns={coreTierDetails[selectedTab]?.core?.columns ?? []}
            />
          ) : null}

          {coreTierDetails[selectedTab]?.core?.values.length > 0 &&
          ability.can('PUT', 'Pricing Model') ? (
            <Box sx={componentStyle.btnContainer}>
              <Button disabled={showLoader} sx={commonStyle.button} onClick={saveCoreModel}>
                {showLoader ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  intl?.formatMessage({ id: 'save' })
                )}
              </Button>
            </Box>
          ) : null}
          {ability.can('POST', 'Pricing Model') ? (
            <SaveInput
              showProgress={modelVersionLoader}
              value={versionName}
              onClick={clonePricingModel}
              onTextChange={(event) => {
                setVersionName(event.target.value);
              }}
              btnText="saveAs"
              placeholder="versionName"
            />
          ) : null}
        </>
      ) : null}
      {isOpen ? (
        <DialogBox
          dialogConfig={{
            isRightMenu: true,
            name: isEdit ? 'updateColumn' : 'addColumn',
            fields: getColumnFields(
              { ...columnData, outputFormulaValue: columnData.formula },
              setColumnData,
              selectedPriceStructure?.name,
              isEdit,
              coreTierDetails[selectedTab]?.core?.columns ?? [],
            ),
            open: isOpen,
            handleClose: closePopup,
            handleSave: saveColumn,
            initialValues: {
              name: columnData.name ?? '',
              columnType: columnData.columnType ?? '',
              outputFormulaValue: columnData.formula ?? '',
              config: columnData.config ?? '',
            },
            schema: Yup.object({
              name: Yup.string()
                .trim()
                .required('Please enter column name')
                .matches(
                  REGEX,
                  'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
                )
                .test('column-name', intl?.formatMessage({ id: 'columnNameExists' }), (values) => {
                  if (values) {
                    const trimName = values.trim();
                    const columnKey = trimName.replaceAll(' ', '_').toLowerCase();
                    if (isEdit && columnData.key === columnKey) {
                      return true;
                    }
                    return (
                      coreTierDetails[selectedTab]?.core?.columns.findIndex(
                        (item: any) => item.key === columnKey,
                      ) === -1
                    );
                  }
                  return true;
                }),
              columnType: Yup.string().required('Please select column type'),
              outputFormulaValue:
                columnData.columnType === 'output' || columnData.columnType === 'intermediate'
                  ? Yup.string()
                      .required('Please enter output formula')
                      .test('output-formula', errorStr, (values) => {
                        if (columnData?.is_code_editor) return true;
                        return validateOutputFormula(values);
                      })
                  : Yup.string(),
            }),
          }}
        />
      ) : null}
      <MetricDialog
        onSetColumn={(columns: any) => setMetricColumns(columns)}
        handleSave={addMetricColumn}
        open={openMetricDialog}
        data={metricColumns}
      />
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
export default injectIntl(CoreModel);
