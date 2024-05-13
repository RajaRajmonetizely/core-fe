/* eslint-disable */
import { Box, Button, CircularProgress } from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import * as Yup from 'yup';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import DialogBox from '../../components/DialogBox/DialogBox';
import PricingStructureTable from '../../components/PricingStructureTable/PricingStructureTable';
import Snackbar from '../../components/Snackbar/Snackbar';
import { finalOutputColumn } from '../../constants/constants';
import { getColumnFields } from '../../constants/dialogBoxConstants';
import { rangeColumns } from '../../mocks/coreModel';
import { ISnackBar } from '../../models/common';
import { IMetrics, IPricingColumn, IPricingStructure } from '../../models/pricing-model';
import { setCustomTabData, setModelDetails } from '../../store/pricing_model/pricingModel.slice';
import commonStyle from '../../styles/commonStyle';
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
  addonId: any;
  tierId: any;
  intl: any;
}

const CustomAddOnModel: React.FC<IProps> = ({ addonId, tierId, intl }): ReactElement => {
  const dispatch = useDispatch();
  const { modelId } = useParams();
  const ability = useSelector((state: any) => state.auth.ability);
  const [showLoader, setLoader] = useState(false);
  const pricingStructure = useSelector((state: any) => state.pricingModel.pricingStructure);
  const [priceMetric, setPriceMetric] = useState<any>([]);
  const [priceStructure, setPriceStructure] = useState<any>({});
  const selectedPricingModel = useSelector((state: any) => state.pricingModel.selectedPricingModel);
  const selectedPriceStructure = useSelector(
    (state: any) => state.pricingModel.selectedPriceStructure,
  );
  const selectedPriceMetric = useSelector((state: any) => state.pricingModel.selectedPriceMetric);
  const customTabData = useSelector((state: any) => state.pricingModel.customTabData);
  const pricingMetrics = useSelector((state: any) => state.pricingModel.pricingMetrics);
  const modelDetails = useSelector((state: any) => state.pricingModel.modelDetails);
  const [addonModel, setAddonModel] = useState<any>({});
  const [isOpen, setOpen] = useState(false);
  const [columnData, setColumnData] = useState<any>('');
  const [isEdit, setIsEdit] = useState(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [errorStr, setErrorStr] = useState<string>('');
  const [metricColumns, setMetricColumns] = useState([]);
  const [openMetricDialog, setOpenMetricDialog] = useState(false);

  useEffect(() => {
    setPriceMetric(
      customTabData[addonId]?.metric_details?.map((d: string) =>
        pricingMetrics.find((p: any) => p.id === d),
      ),
    );
    setAddonModel(customTabData[addonId]);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (addonModel.pricing_structure_id) {
      setPriceStructure(
        pricingStructure.find((p: any) => p.id === addonModel.pricing_structure_id),
      );
    }
    // eslint-disable-next-line
  }, [addonModel.pricing_structure_id]);

  const addNewRow = () => {
    const json = JSON.stringify(addonModel);
    const tempArray = JSON.parse(json);
    tempArray.values.push({});
    setAddonModel(tempArray);
  };

  const openPopup = () => {
    setOpen(true);
  };

  const closePopup = () => {
    setOpen(false);
    setIsEdit(false);
    setColumnData('');
  };

  const addNewColumn = (data: any) => {
    const json = JSON.stringify(addonModel);
    const tempObject = JSON.parse(json);
    const inputColumns: any = [];
    const outputColumns: any = [];
    tempObject.columns.push(data);
    tempObject.columns.map((item: any) => {
      if (item.is_output_column || item.is_intermediate_column) {
        outputColumns.push(item);
      } else {
        inputColumns.push(item);
      }
    });
    tempObject.columns = inputColumns.concat(outputColumns);
    setIsEdit(false);
    setAddonModel(tempObject);
  };

  const updateColumn = (data: any) => {
    const json = JSON.stringify(addonModel);
    const tempObject = JSON.parse(json);
    const findIndex = tempObject.columns.findIndex((item: any) => item.id === data.id);
    delete data.outputFormulaValue;
    if (findIndex > -1) {
      tempObject.columns[findIndex] = data;
    }
    setIsEdit(false);
    setAddonModel(tempObject);
  };

  const onEdit = (item: any) => {
    const json = JSON.stringify(item);
    const tempItem = JSON.parse(json);
    setColumnData(tempItem);
    setIsEdit(true);
    openPopup();
  };

  const saveColumn = (dynamicColumnData: IPricingColumn = {} as IPricingColumn) => {
    if (columnData.name) {
      const trimName = columnData.name.trim();
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

  const getColumnType = (dynamicColumnData: any) => {
    return {
      is_input_column:
        dynamicColumnData.columnType === 'normal' ||
        columnData.columnType === 'normal' ||
        dynamicColumnData.columnType === 'upto' ||
        columnData.columnType === 'upto',
      is_unit_column:
        columnData.config === 'unitColumn' || dynamicColumnData.columnType === 'unitColumn',
      is_upto_column: dynamicColumnData.columnType === 'upto' || columnData.columnType === 'upto',
      is_intermediate_column:
        dynamicColumnData.columnType === 'intermediate' || columnData.columnType === 'intermediate',
      is_metric_column:
        columnData.columnType === 'range' || dynamicColumnData.columnType === 'range',
      is_output_column:
        columnData.columnType === 'output' || dynamicColumnData.columnType === 'output',
      width:
        columnData.columnType === 'range' || dynamicColumnData.columnType === 'range' ? 392 : 300,
      sub_columns:
        columnData.columnType === 'range' || dynamicColumnData.columnType === 'range'
          ? rangeColumns
          : [],
    };
  };

  const onTextChange = (value: any, rowIndex: number, column: any, subKey?: string) => {
    const json = JSON.stringify(addonModel);
    const tempArray = JSON.parse(json);
    if (subKey) {
      if (!tempArray.values[rowIndex][column.key]) {
        tempArray.values[rowIndex][column.key] = {};
      }
      tempArray.values[rowIndex][column.key][subKey] = value;
    } else {
      tempArray.values[rowIndex][column.key] = value;
    }
    setAddonModel(tempArray);
  };

  const removeNewColumn = (data: any) => {
    const json = JSON.stringify(addonModel);
    const tempArray = JSON.parse(json);
    const findIndex = tempArray.columns.findIndex((item: any) => item.id === data.id);
    if (findIndex > -1) {
      tempArray.columns.splice(findIndex, 1);
    }
    setIsEdit(false);
    setAddonModel(tempArray);
  };

  const onDeleteRow = (index: number) => {
    const json = JSON.stringify(addonModel);
    const tempArray = JSON.parse(json);
    tempArray.values.splice(index, 1);
    setIsEdit(false);
    setAddonModel(tempArray);
  };

  const validateField = (core: any) => {
    let isValidate = true;
    if (priceMetric.length === 0) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseSelectMetric' }),
      });
      isValidate = false;
      return false;
    }
    if (!priceStructure.id) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseSelectStructure' }),
      });
      isValidate = false;
      return false;
    }

    core.values.map((row: any) => {
      if (isValidate) {
        core.columns.map((col: any) => {
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
    const filterOutput = core.columns.filter((item: IPricingColumn) => item.is_output_column);
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

  const saveCustomModel = async () => {
    try {
      const json = JSON.stringify(modelDetails);
      const modelObject = JSON.parse(json);
      const tier = modelObject.details.findIndex((t: any) => t.tier_id === tierId);
      let addOnList = [];
      if (
        modelDetails.details[tier] &&
        modelDetails.details[tier].details &&
        modelDetails.details[tier].details.addons
      ) {
        addOnList = modelObject.details[tier].details.addons;
        const findIndex = addOnList.findIndex((item: any) => item.id === addonId);
        if (findIndex > -1) {
          addOnList[findIndex] = { ...addOnList[findIndex], ...addonModel };
        } else {
          addOnList.push({ ...addonModel });
        }
      }
      if (addOnList.length === 0) {
        addOnList.push({ ...addonModel });
      }
      if (
        addOnList &&
        addOnList.length > 0 &&
        validateField(JSON.parse(JSON.stringify(addonModel)))
      ) {
        setLoader(true);
        const body: any = {};
        body.metric_details = selectedPriceMetric.map((metricData: IMetrics) => metricData.id);
        body.pricing_structure_id = selectedPriceStructure.id;
        if (modelObject.details[tier].details && !modelObject.details[tier].details.addons) {
          modelObject.details[tier].details.addons = {};
        }
        modelObject.details[tier].details.addons = addOnList;
        const details: any = [];
        modelObject.details.map((tierData: any) => {
          if (tierData.details.addons) {
            tierData.details.addons.forEach((adb: any) => {
              if (adb.is_custom_metric && adb.metric_details) {
                adb.metric_details = adb.metric_details.map((metric: any) => metric.id || metric);
              }
            });
          }
          details.push({
            pricing_model_detail_id: tierData.pricing_model_detail_id,
            ...tierData.details,
          });
          return null;
        });
        body.details = details;
        const response = await PricingModelClient.updateModelData(modelId as string, body);
        if (response.message === 'success') {
          const modelResponse = await PricingModelClient.getDetailsByModelId(modelId as string);
          if (modelResponse.message === 'success') {
            dispatch(setCustomTabData({ [addonId]: addonModel }));
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

  const onSelectPricingStructure = (value: any) => {
    if (value) {
      const columns: any = [];
      value.details.map((col: any) => {
        if (col.key === 'output') {
          columns.push({
            ...col,
            id: uuidv4(),
            columnType: 'output',
          });
        } else {
          columns.push(col);
        }
        return null;
      });
      setAddonModel((prev: any) => {
        return {
          ...prev,
          ...(value.name === 'Custom' ? { metric_details: [] } : {}),
          ...{
            pricing_structure_id: value.id,
            columns: value.name === 'Custom' ? [{ ...finalOutputColumn }] : columns,
            values:
              customTabData[addonId].pricing_structure_id === value.id
                ? customTabData[addonId].values
                : new Array(1).fill({}),
          },
        };
      });
      setPriceStructure(value);
    }
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
    const columnsKeys = addonModel.columns.map((item: any) => item.key);
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
      const json = JSON.stringify(addonModel);
      const tempObject = JSON.parse(json);
      const columns: any = [];
      tempObject.columns.map((col: any) => {
        if (col.metric_id) {
          const findIndex = selectedMetrics.findIndex((metric: any) => metric.id === col.metric_id);
          if (findIndex > -1) {
            columns.push(col);
          }
        } else {
          columns.push(col);
        }
      });
      tempObject.columns = columns;
      if (
        (selectedStructure.name === 'Custom' && selectedMetrics?.length === 1) ||
        selectedMetrics?.length > 1
      ) {
        let showColumnModal = false;
        const array: any = [];
        selectedMetrics.map((metric: IMetrics) => {
          const findIndex = columns.findIndex((col: any) => col.metric_id === metric.id);
          if (findIndex === -1) {
            showColumnModal = true;
            array.push(metric);
          }
          return null;
        });
        setMetricColumns(array);
        if (showColumnModal) {
          setOpenMetricDialog(true);
        }
      }
      tempObject.metric_details = selectedMetrics.map((v: any) => v.id);
      setAddonModel(tempObject);
    }
  };

  const addMetricColumn = () => {
    setOpenMetricDialog(false);
    const json = JSON.stringify(addonModel);
    const tempObject = JSON.parse(json);
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
      if (tempObject.columns) {
        tempObject.columns.push(body);
      }
    });
    const inputColumns: any = [];
    const outputColumns: any = [];
    tempObject.columns.map((item: any) => {
      if (item.is_output_column || item.is_intermediate_column) {
        outputColumns.push(item);
      } else {
        inputColumns.push(item);
      }
    });
    tempObject.columns = inputColumns.concat(outputColumns);
    tempObject.metric_details = priceMetric.map((v: any) => v.id);
    setAddonModel(tempObject);
  };

  return (
    <>
      <SelectionSection
        priceMetric={priceMetric}
        priceModelVersion={selectedPricingModel}
        priceStructure={priceStructure}
        displayConfig={{
          showPricingMetric: true,
          showPricingStructure: true,
          showPricingModelVersion: false,
        }}
        setPriceMetric={(value: any) => {
          if (value.length < 4) {
            handleMetricColumn(priceStructure, value);
            setPriceMetric(value);
          } else {
            setSnackBarValues({
              display: true,
              type: 'error',
              message: intl.formatMessage({ id: 'priceMetricLimit' }),
            });
          }
          if (value && value.length > 1) {
            const filterData = pricingStructure.filter(
              (item: IPricingStructure) => item.name === 'Custom',
            );
            if (
              filterData &&
              filterData.length > 0 &&
              (!priceStructure || (priceStructure && priceStructure.name !== 'Custom'))
            ) {
              onSelectPricingStructure(filterData[0]);
            }
          }
          if (
            value.length === 1 &&
            (!priceStructure || (priceStructure && priceStructure.name !== 'Custom'))
          ) {
            setAddonModel({ ...addonModel, metric_details: value.map((v: any) => v.id) });
          }
        }}
        setPricingModelVersion={() => {}}
        setPricingStructure={(value: any) => {
          if (value.name === 'Custom') {
            setPriceMetric([]);
          }
          onSelectPricingStructure(value);
        }}
      />

      <>
        {priceStructure?.id ? (
          <PricingStructureTable
            onAddColumn={openPopup}
            onAddRow={addNewRow}
            selectedPricingStructure={priceStructure}
            onEdit={onEdit}
            onDelete={removeNewColumn}
            onTextChange={onTextChange}
            onDeleteRow={onDeleteRow}
            rows={addonModel.values ?? []}
            columns={addonModel.columns ?? []}
          />
        ) : null}

        {addonModel.values?.length > 0 && ability.can('PUT', 'Pricing Model') ? (
          <Box sx={componentStyle.btnContainer}>
            <Button disabled={showLoader} sx={commonStyle.button} onClick={saveCustomModel}>
              {showLoader ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                intl?.formatMessage({ id: 'save' })
              )}
            </Button>
          </Box>
        ) : null}
      </>

      {isOpen ? (
        <DialogBox
          dialogConfig={{
            isRightMenu: true,
            name: isEdit ? 'updateColumn' : 'addColumn',
            fields: getColumnFields(
              { ...columnData, outputFormulaValue: columnData.formula },
              setColumnData,
              priceStructure?.name,
              isEdit,
              addonModel.columns ?? [],
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
                      addonModel?.columns.findIndex((item: any) => item.key === columnKey) === -1
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
export default injectIntl(CustomAddOnModel);
