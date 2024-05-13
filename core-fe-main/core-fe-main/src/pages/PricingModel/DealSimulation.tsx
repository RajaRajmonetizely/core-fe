import {
  Box,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import _ from 'lodash';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import PricingCalculatorClient from '../../api/PricingCalculator/PricingCalculatorAPI';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import PageLoader from '../../components/PageLoader/PageLoader';
import { ITier } from '../../models/plan';
import { IPricingModel } from '../../models/pricing-model';
import {
  setSimulationModel,
  setSimulationRowData,
  setSimulationTier,
  setSimulationTierwiseRowData,
} from '../../store/pricing_model/pricingModel.slice';
import { columns, rows, totalRowObject } from './DealSimulationConfig';
import SelectionSection from './SelectionSection';

interface IProps {
  intl: any;
}

const DealSimulation: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const modelDetails = useSelector((state: any) => state.pricingModel.modelDetails);
  const simulationTier = useSelector((state: any) => state.pricingModel.simulationTier);
  const selectedPricingModel = useSelector((state: any) => state.pricingModel.selectedPricingModel);
  const simulationPricingModel = useSelector(
    (state: any) => state.pricingModel.simulationPricingModel,
  );
  const simulationRowData = useSelector((state: any) => state.pricingModel.simulationRowData);
  const simulationTierwiseRowData = useSelector(
    (state: any) => state.pricingModel.simulationTierwiseRowData,
  );
  const pricingModels = useSelector((state: any) => state.pricingModel.pricingModels);
  const [metricRange, setMetricRange] = useState({} as any);
  const [loader, setLoader] = useState<any>(null);
  const [loaderDrivingFields, setLoaderDrivingFields] = useState(false);
  const [simulationModelDetails, setModelDetails] = useState<any>({});

  useEffect(() => {
    dispatch(setSimulationModel(selectedPricingModel));
    if (selectedPricingModel?.details.length)
      dispatch(setSimulationTier(selectedPricingModel?.details[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (simulationPricingModel?.id && pricingModels && pricingModels.length > 0) {
      const filterData = pricingModels.filter(
        (item: IPricingModel) => item.id === simulationPricingModel.id,
      );
      if (filterData && filterData.length > 0) {
        const data = filterData[0];
        if (JSON.stringify(data) !== JSON.stringify(simulationPricingModel)) {
          dispatch(setSimulationModel(data));
        }
      }
    }
    // eslint-disable-next-line
  }, [simulationPricingModel, pricingModels]);

  useEffect(() => {
    if (modelDetails?.id && simulationTier?.tier_id) {
      const filterData = modelDetails.details.filter(
        (item: ITier) => item.tier_id === simulationTier?.tier_id,
      );
      if (filterData && filterData.length > 0) {
        const data = filterData[0];
        if (JSON.stringify(data) !== JSON.stringify(simulationTier)) {
          dispatch(setSimulationTier(data));
          if (_.has(simulationTierwiseRowData, simulationTier.tier_id)) {
            dispatch(setSimulationRowData(simulationTierwiseRowData[simulationTier.tier_id]));
          }
        }
      }
    }
    // eslint-disable-next-line
  }, [modelDetails, simulationTier]);

  useEffect(() => {
    if (simulationPricingModel.id && simulationTier.tier_id) {
      getTierDrivingFields();
    }
    // eslint-disable-next-line
  }, [simulationPricingModel, simulationTier]);

  const getTierDrivingFields = async () => {
    try {
      setLoaderDrivingFields(true);
      const response = await PricingCalculatorClient.getModelDetails(
        simulationPricingModel.id,
        simulationTier.tier_id,
      );
      const modelResponse = await PricingModelClient.getDetailsByModelId(simulationPricingModel.id);
      if (response.message === 'success' && modelResponse.message === 'success') {
        setModelDetails(modelResponse.data);
        const rangeColumn = simulationTier?.details?.core.columns.filter(
          (item: any) => item.is_metric_column,
        );
        const uptoColumn = simulationTier?.details?.core.columns.filter(
          (item: any) => item.is_upto_column,
        );
        const tempRows = JSON.parse(JSON.stringify(rows));
        tempRows.map((item: any, i: number) => {
          if (item.isTier) {
            tempRows[i].col1 = simulationTier.tier_name;
          }
          tempRows[i].key = uuidv4();
          return null;
        });
        const filterData = modelResponse.data.details.filter(
          (item: any) => item.tier_id === simulationTier.tier_id,
        );
        if (filterData && filterData.length > 0) {
          const tierDetails: any = filterData[0];
          if (tierDetails && tierDetails.details && tierDetails.details.addons) {
            tierDetails.details.addons.map((adb: any) => {
              if (adb.is_custom_metric) {
                if (response.data.addon) {
                  response.data.addon.map((fields: any) => {
                    Object.keys(fields).map((key) => {
                      if (key === adb.id) {
                        fields[key].map((addon: any) => {
                          tempRows.push({
                            col1: '',
                            col2: adb.addOnFeatures,
                            id: adb.id,
                            small: '',
                            medium: '',
                            large: '',
                            rowType: 'addon_multiple',
                            key: uuidv4(),
                            addonData: addon,
                          });
                          return null;
                        });
                      }
                      return null;
                    });
                    return null;
                  });
                }
              } else {
                tempRows.push({
                  col1: '',
                  col2: adb.is_custom_metric ? adb.metric_name : adb.addOnFeatures,
                  id: adb.id,
                  small: '',
                  medium: '',
                  large: '',
                  rowType: adb?.details?.sell_multiple ? 'addon_multiple' : 'addon',
                  key: uuidv4(),
                });
              }
              return null;
            });
          }
        }
        tempRows.push(totalRowObject);
        const object = {} as any;
        const rangeMinMaxObject = {} as any;
        if (rangeColumn.length) {
          rangeColumn.map((column: any) => {
            object[column.key] = JSON.parse(JSON.stringify(tempRows));
            rangeMinMaxObject[column.key] = {
              min: simulationTier.details.core.values[0][column.key]?.low,
              max: simulationTier.details.core.values[
                simulationTier.details.core.values.length - 1
              ][column.key]?.high,
            };
            return null;
          });
        }
        if (uptoColumn.length) {
          uptoColumn.map((column: any) => {
            object[column.key] = JSON.parse(JSON.stringify(tempRows));
            rangeMinMaxObject[column.key] = {
              min: 0,
              max: simulationTier.details.core.values[
                simulationTier.details.core.values.length - 1
              ][column.key],
            };
            return null;
          });
        }
        setMetricRange(rangeMinMaxObject);
        if (_.has(simulationTierwiseRowData, simulationTier.tier_id)) {
          dispatch(setSimulationRowData(simulationTierwiseRowData[simulationTier.tier_id]));
        } else {
          dispatch(setSimulationRowData(object));
          dispatch(
            setSimulationTierwiseRowData({
              ...simulationTierwiseRowData,
              [simulationTier.tier_id]: object,
            }),
          );
        }
        setLoaderDrivingFields(false);
      }
    } catch (e) {
      console.error(e, 'e');
      setLoaderDrivingFields(false);
      dispatch(setSimulationRowData({}));
      dispatch(
        setSimulationTierwiseRowData({
          ...simulationTierwiseRowData,
          [simulationTier.tier_id]: {},
        }),
      );
    }
  };

  const handleValueChange = useCallback(
    (key: string, c: any, value: any, i: number, data: any, modelData: any) => {
      setLoader({
        [key]: {
          [c.id]: i,
        },
      });
      const tempObject = JSON.parse(JSON.stringify(data));
      tempObject[key][i][c.id] = Number(value);
      dispatch(setSimulationRowData(tempObject));
      dispatch(
        setSimulationTierwiseRowData({
          ...simulationTierwiseRowData,
          [simulationTier.tier_id]: tempObject,
        }),
      );
      handleChangeLogic(tempObject, key, c, value, i, modelData);
    },
    // eslint-disable-next-line
    [metricRange],
  );

  const handleChangeLogic = _.debounce(
    (tempObject, key: string, c: any, value: any, i: number, modelData: any) => {
      getSimulationData(c, key, tempObject, modelData);
    },
    1000,
  );

  // eslint-disable-next-line
  const getSimulationData = async (c: any, key: string, tempObject: any, modelData: any) => {
    try {
      const body = {} as any;
      body.tier_id = simulationTier.tier_id;
      body.addons = [];
      let isValid = true;
      tempObject[key].map((item: any) => {
        if (item.isTier) {
          if (!body.quantity) {
            body.quantity = {} as any;
          }
          body.quantity[key] = item[c.id];

          if (isValid) {
            isValid = isValueInRange(key, item[c.id]);
          }
        }
        if (
          (item.rowType === 'addon' || item.rowType === 'addon_multiple') &&
          item[c.id] !== '' &&
          item[c.id] !== undefined
        ) {
          if (item.addonData) {
            const findIndex = body.addons.findIndex((adb: any) => adb.addon_id === item.id);
            if (findIndex > -1) {
              body.addons[findIndex].addon_units[item.addonData.metric_column.key] = item[c.id];
              body.addons[findIndex].addon_output_keys[item.addonData.metric_column.key] =
                item.addonData.output_column.key;
            } else {
              body.addons.push({
                addon_id: item.id,
                addon_units: {
                  [item.addonData.metric_column.key]: item[c.id],
                },
                addon_output_keys: {
                  [item.addonData.metric_column.key]: item.addonData.output_column.key,
                },
              });
            }
          } else {
            body.addons.push({ addon_id: item.id, addon_units: item[c.id] });
          }
        }
        return null;
      });
      if (isValid) {
        const response = await PricingModelClient.getSimulationData(modelData.id, [body]);
        if (response.message === 'success' && response.data.length > 0) {
          const tempRowData = JSON.parse(JSON.stringify(tempObject));
          const responseData = response.data[0];
          tempRowData[key].map((item: any, i: number) => {
            if (item.rowType === 'baseFee') {
              tempRowData[key][i][c.id] =
                typeof responseData.core_output === 'object' ? 0 : responseData.core_output;
            }
            if (item.rowType === 'total') {
              tempRowData[key][i][c.id] =
                typeof responseData.total === 'object' ? 0 : responseData.total;
            }
            return null;
          });
          dispatch(setSimulationRowData(tempRowData));
          dispatch(
            setSimulationTierwiseRowData({
              ...simulationTierwiseRowData,
              [simulationTier.tier_id]: tempRowData,
            }),
          );
        }
        setLoader(null);
      } else {
        setLoader(null);
      }
    } catch (e) {
      setLoader(null);
      console.error(e);
    }
  };

  const isFloat = (n: any) => {
    return Number(n) === n && n % 1 !== 0;
  };

  const isValueInRange = (key: string, value: string) => {
    // eslint-disable-next-line
    return _.inRange(Number(value), metricRange[key]?.min, metricRange[key]?.max + 1);
  };

  const getRangeName = (key: string) => {
    const splitName = key.split('_');
    let str = '';
    splitName.map((item) => {
      // eslint-disable-next-line
      str += item.charAt(0).toUpperCase() + item.slice(1) + ' ';
      return null;
    });
    return str;
  };

  return (
    <>
      <SelectionSection
        tiers={modelDetails.details}
        priceModelVersion={simulationPricingModel}
        selectedTier={simulationTier}
        setPricingModelVersion={(value: IPricingModel) => {
          dispatch(setSimulationTierwiseRowData({}));
          dispatch(setSimulationModel(value));
        }}
        setSelectedTier={(value: ITier) => dispatch(setSimulationTier(value))}
        displayConfig={{
          showPricingMetric: false,
          showPricingStructure: false,
          showPricingModelVersion: true,
          showTiers: true,
        }}
      />
      <br />
      {loaderDrivingFields ? <PageLoader /> : null}
      {simulationTier.tier_id && simulationPricingModel.id && !loaderDrivingFields ? (
        <Grid container>
          <Grid item md={12}>
            <Paper sx={{ padding: '18px 33px' }}>
              <Box
                sx={{
                  width: '910px',
                  height: '40px',
                  backgroundColor: '#E2E8F0',
                  textAlign: 'center',
                  borderRadius: '10px 10px 0px 0px',
                }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 700,
                    verticalAlign: 'middle',
                    // lineHeight: '16px',
                    paddingTop: '10px',
                  }}>
                  {intl.formatMessage({ id: 'dealSimulator' })}
                </Typography>
              </Box>
              <Box style={{ display: 'inline-table', width: '910px' }}>
                <Box style={{ display: 'flex' }}>
                  {columns?.map((r: any) => {
                    return (
                      <Box
                        key={r.id}
                        sx={{
                          verticalAlign: 'top',
                          width: '160x',
                          backgroundColor: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                        }}>
                        <Typography
                          sx={{
                            fontFamily: 'Helvetica',
                            fontStyle: 'normal',
                            fontWeight: 700,
                            width: '160px',
                            fontSize: '14px',
                            color: '#000000',
                            padding: '20px 10px',
                            textAlign: 'center',
                          }}>
                          {r.name}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {Object.keys(simulationRowData).map((key: any) => {
                  return (
                    <Box key={key}>
                      {simulationRowData[key] &&
                        simulationRowData[key].map((r: any, i: number) => {
                          return (
                            <Box key={r.key} style={{ display: 'flex' }}>
                              {columns.map((c: any) => {
                                return (
                                  <Box
                                    key={c.id}
                                    sx={{
                                      verticalAlign: 'top',
                                      width: '160x',
                                      backgroundColor: 'white',
                                      border: '1px solid rgba(0, 0, 0, 0.05)',
                                    }}>
                                    {(r.rowType === 'input' ||
                                      r.rowType === 'addon' ||
                                      r.rowType === 'addon_multiple') &&
                                    !['col1', 'col2'].includes(c.id) ? (
                                      <>
                                        {r.rowType === 'addon' && (
                                          <Select
                                            fullWidth
                                            sx={{
                                              '& .MuiSelect-select': {
                                                textAlign: 'center',
                                              },
                                              margin: '10px',
                                              width: '160px',
                                            }}
                                            inputProps={{
                                              readOnly: loader && loader[key]?.[c.id] !== i,
                                            }}
                                            value={r[c.id] ?? ''}
                                            onChange={(e: any) => {
                                              e.preventDefault();
                                              const { value } = e.target;
                                              handleValueChange(
                                                key,
                                                c,
                                                value,
                                                i,
                                                simulationRowData,
                                                simulationModelDetails,
                                              );
                                            }}>
                                            {[0, 1].map((p: any) => {
                                              return (
                                                <MenuItem key={uuidv4()} value={p}>
                                                  {p}
                                                </MenuItem>
                                              );
                                            })}
                                          </Select>
                                        )}
                                        {(r.rowType === 'addon_multiple' ||
                                          r.rowType === 'input') && (
                                          <TextField
                                            type="number"
                                            variant="outlined"
                                            defaultValue={r[c.id] ?? ''}
                                            InputProps={{
                                              readOnly: loader && loader[key]?.[c.id] !== i,
                                            }}
                                            sx={{
                                              margin: '10px',
                                              width: '160px',
                                              input: { textAlign: 'center' },
                                            }}
                                            error={
                                              r.rowType === 'input' &&
                                              !isValueInRange(key, r[c.id]) &&
                                              r[c.id] !== ''
                                            }
                                            helperText={
                                              r.rowType === 'input' &&
                                              !isValueInRange(key, r[c.id]) &&
                                              r[c.id] !== ''
                                                ? `Please enter values between ${metricRange[key]?.min} and ${metricRange[key]?.max} `
                                                : ''
                                            }
                                            onChange={(e) => {
                                              e.preventDefault();
                                              const { value } = e.target;

                                              if (
                                                r.rowType === 'addon_multiple' ||
                                                r.rowType === 'input'
                                              ) {
                                                handleValueChange(
                                                  key,
                                                  c,
                                                  value,
                                                  i,
                                                  simulationRowData,
                                                  simulationModelDetails,
                                                );
                                              }
                                            }}
                                          />
                                        )}
                                      </>
                                    ) : (
                                      <Box sx={{ margin: '10px', width: '160px' }}>
                                        <Typography
                                          sx={{
                                            fontFamily: 'Helvetica',
                                            fontStyle: 'normal',
                                            fontWeight: !['col1', 'col2'].includes(c.id)
                                              ? 500
                                              : 700,

                                            fontSize: '14px',
                                            color: '#000000',
                                            padding: '14px',
                                            paddingRight: '28px',
                                            textAlign: 'center',
                                          }}>
                                          {
                                            // eslint-disable-next-line
                                            r.rowType === 'total' &&
                                            loader &&
                                            loader[key] &&
                                            loader[key][c.id] !== undefined ? (
                                              <CircularProgress
                                                sx={{ color: '#5D5FEF' }}
                                                size={24}
                                              />
                                            ) : // eslint-disable-next-line
                                            isFloat(r[c.id]) ? (
                                              r[c.id].toFixed(2)
                                            ) : c.id === 'col1' &&
                                              r[c.id] &&
                                              r[c.id] !== 'Total' ? (
                                              getRangeName(key)
                                            ) : (
                                              r[c.id]
                                            )
                                          }
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                            </Box>
                          );
                        })}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </>
  );
};
export default injectIntl(DealSimulation);
