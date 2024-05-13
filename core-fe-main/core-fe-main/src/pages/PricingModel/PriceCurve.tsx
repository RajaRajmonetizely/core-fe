import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import _ from 'lodash';
import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import { COLORS } from '../../constants/constants';
import { ITier } from '../../models/plan';
import { IPricingModel } from '../../models/pricing-model';
import {
  setAddonConfigData,
  setPricingCurveModel,
} from '../../store/pricing_model/pricingModel.slice';
import { generateRandomColor } from '../../utils/helperService';
import AddonConfigDialog from './AddonConfigDialog';
import SelectionSection from './SelectionSection';

const pageStyle = {
  cardContainer: {
    padding: '90px 56px',
    paddingTop: '25px',
  },
  addOnContainer: {
    display: 'flex',
    cursor: 'pointer',
  },
  rightContainer: {
    paddingTop: '56px',
    paddingLeft: '56px',
  },
  addOnConfigText: {
    color: '#4168E1',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'uppercase',
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: 'auto',
  },
  iconStyle: {
    marginLeft: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
    color: '#4168E1',
    marginRight: '8px',
  },
  checkboxLabelStyle: {
    color: '#718096',
    fontSize: '1rem',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  checkboxStyle: {
    color: '#718096',
    '& .MuiSvgIcon-root': { fontSize: 36 },
  },
  checkboxContainer: {
    display: 'flex',
  },
  formLabel: {
    marginRight: '6px',
  },
  tiersContainer: {
    marginTop: '26px',
  },
  headingStyle: {
    fontSize: '1.4rem',
    letterSpacing: '0.00938em',
    color: '#3B3F4D',
    fontFamily: 'Helvetica',
    fontWeight: '700',
    marginTop: '46px',
    marginBottom: '46px',
    textAlign: 'center',
  },
};

interface IProps {
  intl: any;
}

const PriceCurve: React.FC<IProps> = ({ intl }): ReactElement => {
  const [open, setOpen] = React.useState(false);
  const dispatch = useDispatch();
  const [loader, setLoader] = useState(false);
  const [configLoader, setConfigLoader] = useState(false);
  const [tierLoader, setTierLoader] = useState(false);
  const [pricingCurve, setPricingCurve] = useState({} as any);
  const [pricingCurveTemp, setPricingCurveTemp] = useState({} as any);
  const pricingCurveModel = useSelector((state: any) => state.pricingModel.pricingCurveModel);
  const selectedPricingModel = useSelector((state: any) => state.pricingModel.selectedPricingModel);
  const addonConfig = useSelector((state: any) => state.pricingModel.addonConfig);
  const pricingModels = useSelector((state: any) => state.pricingModel.pricingModels);
  const [rangeWiseTiers, setRangeWiseTiers] = useState({} as any);
  const [subPricingCurveId, setSubPricingCurveId] = useState<any>([]);
  const [allTierdata, setAllTierData] = useState<any>({});
  const [resetData, setResetData] = useState<boolean>(false);
  const [modelDetails, setModelDetails] = useState<any>({});
  const [selectedTiers, setSelectedTiers] = useState<any>([]);
  const [tierAddonDetails, setTierAddonDetails] = useState<any>([]);
  const [userAddOnData, setUserAddOnData] = useState<any>();

  useEffect(() => {
    dispatch(setPricingCurveModel(selectedPricingModel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pricingCurveModel && pricingCurveModel.id) {
      setResetData(false);
      setSubPricingCurveId([]);
      setAllTierData({});
      getPricingCurve();
    }
    // eslint-disable-next-line
  }, [pricingCurveModel]);

  useEffect(() => {
    if (pricingCurveModel?.id && pricingModels && pricingModels.length > 0) {
      const filterData = pricingModels.filter(
        (item: IPricingModel) => item.id === pricingCurveModel.id,
      );
      if (filterData && filterData.length > 0) {
        const data = filterData[0];
        if (JSON.stringify(data) !== JSON.stringify(pricingCurveModel)) {
          dispatch(setPricingCurveModel(data));
        }
      }
    }
    // eslint-disable-next-line
  }, [pricingCurveModel, pricingModels]);

  useEffect(() => {
    if (pricingCurveModel && pricingCurveModel.id) {
      getPricingCurveConfig();
    }
    // eslint-disable-next-line
  }, [pricingCurveModel]);

  useEffect(() => {
    if (modelDetails && modelDetails.details && !resetData) {
      const tierObject = {} as any;
      const data = [] as ITier[];
      modelDetails?.details.map((item: ITier, i: number) => {
        data.push({
          ...item,
          checked: !!(!subPricingCurveId.length || subPricingCurveId.includes(item.tier_id)),
          color: COLORS[i] || generateRandomColor(),
        });
        return null;
      });
      Object.keys(pricingCurve).forEach((key) => {
        tierObject[key] = JSON.parse(JSON.stringify(data));
      });
      setRangeWiseTiers(tierObject);
      if (!subPricingCurveId.length) {
        setAllTierData(tierObject);
      }
    }
    // eslint-disable-next-line
  }, [modelDetails, pricingCurve]);

  const onSelectPricingModel = (value: IPricingModel) => {
    dispatch(setPricingCurveModel(value));
  };

  const getPricingCurveConfig = async () => {
    try {
      setConfigLoader(true);
      const response = await PricingModelClient.getPricingCurveConfig(pricingCurveModel.id);
      const modelResponse = await PricingModelClient.getDetailsByModelId(pricingCurveModel.id);
      setModelDetails(modelResponse.data);
      const values: any = [];
      const columns = modelResponse.data.details.map((item: any) => {
        let filterData: any = [];
        if (response.data) {
          filterData = response.data.filter((data: any) => {
            return Object.keys(data).findIndex((key) => key === item.tier_id) > -1;
          });
        }
        if (item.details && item.details.addons) {
          item.details.addons.map((a: any) => {
            const addon: any = [];
            if (filterData[0][item.tier_id] && filterData[0][item.tier_id].addon) {
              filterData[0][item.tier_id].addon.map((addonItem: any) => {
                if (addonItem[a.id]) {
                  addon.push(addonItem);
                }
                return null;
              });
            }
            const findIndex = values.findIndex((v: any) => v.id === a.id);
            if (findIndex === -1) {
              const body = {
                name: a.addOnFeatures,
                id: a.id,
                key: uuidv4(),
              } as any;
              if (a.is_custom_metric) {
                body[item.tier_id] = {
                  core: filterData[0][item.tier_id].core,
                  addon,
                };
              } else {
                body[item.tier_id] = a.details;
              }
              values.push(body);
            } else {
              // eslint-disable-next-line
              if (a.is_custom_metric) {
                values[findIndex][item.tier_id] = {
                  core: filterData[0][item.tier_id].core,
                  addon,
                };
              } else {
                values[findIndex][item.tier_id] = a.details;
              }
            }

            return null;
          });
        }
        return { ...item, name: item.tier_name };
      });
      dispatch(
        setAddonConfigData({
          columns: [{ name: 'Config Add-Ons', tier_id: 'addon' }, ...columns],
          values,
        }),
      );
      setConfigLoader(false);
    } catch (e) {
      console.error(e, 'e');
      setConfigLoader(false);
    }
  };

  const getPricingCurve = async (data?: any, checkedTiers?: any) => {
    try {
      setLoader(true);
      setTierAddonDetails([]);
      setUserAddOnData(data);
      const body = [] as any;
      if (data) {
        modelDetails.details.map((item: any) => {
          const filterData = data.values.filter((v: any) => {
            return v[item.tier_id] && v[item.tier_id].quantity;
          });
          const addons: any = [];
          filterData.map((k: any) => {
            addons.push({ addon_id: k.id, addon_units: k[item.tier_id].quantity });
            return null;
          });
          const filterCustomAddon = data.values.filter((v: any) => {
            return v[item.tier_id] && v[item.tier_id].addonUnits;
          });
          filterCustomAddon.map((k: any) => {
            addons.push({ addon_id: k.id, addon_units: k[item.tier_id].addonUnits });
            return null;
          });
          if (addons.length > 0) {
            setTierAddonDetails([...tierAddonDetails, { tier_id: item.tier_id, addons }]);
          }
          if (addons.length > 0 && checkedTiers.includes(item.tier_id)) {
            body.push({ tier_id: item.tier_id, addons });
          } else if (checkedTiers.includes(item.tier_id)) {
            body.push({
              tier_id: item.tier_id,
              addons: [],
            });
          }
          return null;
        });
      }
      if (!data && !checkedTiers) {
        const localSelectedTiers: any[] = [];
        pricingCurveModel.details.forEach((priceCurveDetails: any) => {
          localSelectedTiers.push(priceCurveDetails.tier_id);
        });
        setSelectedTiers(localSelectedTiers);
      }
      const response = await PricingModelClient.getPricingCurve(pricingCurveModel.id, body);
      if (response?.message === 'success') {
        setPricingCurve(response.data);
        setPricingCurveTemp(response.data);
      }
      setLoader(false);
    } catch (e) {
      setLoader(false);
    }
  };

  const openDialog = () => {
    setOpen(true);
  };

  const getSubPricingCurve = async (data: any) => {
    try {
      const localSelectedTiers: any[] = [];
      setTierLoader(true);
      const body = data.map((d: any) => {
        localSelectedTiers.push(d.tier_id);
        return {
          tier_id: d.tier_id,
          addons: checkForAddons(d.tier_id),
        };
      });
      setSelectedTiers(localSelectedTiers);
      const response = await PricingModelClient.getPricingCurve(pricingCurveModel.id, body);
      if (response?.message === 'success') {
        setSubPricingCurveId(data.map((d: any) => d.tier_id));
        setPricingCurve(response.data);
      }
      setTierLoader(false);
    } catch (e) {
      setTierLoader(false);
    }
  };

  const checkForAddons = (tierId: string) => {
    let addons;
    tierAddonDetails?.forEach((detail: any) => {
      if (detail.tier_id === tierId) {
        addons = detail.addons;
      }
    });
    return addons ?? [];
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, i: number, key: string) => {
    const tierWiseTempObject = subPricingCurveId.length
      ? { ...allTierdata }
      : { ...rangeWiseTiers };
    tierWiseTempObject[key][i].checked = event.target.checked;
    const tierValue = tierWiseTempObject[key].filter((t: any) => t.checked === true);
    if (tierValue.length < tierWiseTempObject[key].length) {
      getSubPricingCurve(tierValue);
    } else if (tierAddonDetails.length) {
      getSubPricingCurve(tierValue);
    } else {
      setResetData(true);
      setPricingCurve(pricingCurveTemp);
      setRangeWiseTiers(allTierdata);
      setSubPricingCurveId([]);
    }
  };

  const getRangeName = (key: string) => {
    const splitName = key.split('_');
    let str = '';
    splitName.forEach((item) => {
      str += `${item.charAt(0).toUpperCase() + item.slice(1)} `;
    });
    return str;
  };

  const getInterval = (curveData: any) => {
    if (curveData.length >= 100) return 9;
    if (curveData.length >= 50) return 5;
    return 1;
  };

  const getYaxisValues = (curveData: any): any[] => {
    return [
      _.min(Object.values(_.omit(curveData[0], 'name'))),
      _.max(Object.values(_.omit(curveData[curveData.length - 1], 'name'))),
    ];
  };

  const getUserAddOnDetails = (tierId: string) => {
    const addOnDetailsString: string[] = [];
    userAddOnData?.values.forEach((value: any) => {
      if (value[tierId]?.addonUnits) {
        const addOn = `${value.name} (${value[tierId]?.addonUnits.metric_range})`;
        addOnDetailsString.push(addOn);
      } else if (value[tierId]?.quantity) {
        const addOn = `${value.name} (${value[tierId]?.quantity})`;
        addOnDetailsString.push(addOn);
      }
    });
    if (addOnDetailsString.length) {
      return addOnDetailsString.join(', ');
    }
    return null;
  };

  return (
    <>
      <SelectionSection
        setPricingModelVersion={onSelectPricingModel}
        priceModelVersion={pricingCurveModel}
        displayConfig={{
          showPricingMetric: false,
          showPricingStructure: false,
          showPricingModelVersion: true,
        }}
      />
      <br />
      {pricingCurveModel?.id ? (
        <Paper sx={pageStyle.cardContainer}>
          {loader || configLoader ? (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress
                size={38}
                sx={{ color: '#4168E1', marginTop: '10px', marginLeft: 'auto' }}
              />
            </Box>
          ) : (
            <Box>
              <Box sx={pageStyle.addOnContainer}>
                <Button sx={pageStyle.addOnConfigText} onClick={openDialog}>
                  <SettingsIcon sx={pageStyle.iconStyle} />
                  {intl.formatMessage({ id: 'addOnConfig' })}
                </Button>
              </Box>
              {Object.keys(pricingCurve).map((key: string) => {
                return (
                  <Box key={key}>
                    <Box sx={pageStyle.headingStyle}>{getRangeName(key)}</Box>
                    <Grid key={key} container>
                      <Grid item md={9} lg={9} xs={9}>
                        {tierLoader ? (
                          <Stack
                            direction="column"
                            justifyContent="center"
                            alignItems="center"
                            sx={{ height: '50vh' }}>
                            <CircularProgress
                              size={38}
                              sx={{
                                color: '#4168E1',
                                marginTop: '10px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                              }}
                            />
                          </Stack>
                        ) : (
                          <ResponsiveContainer width="100%" height={600}>
                            <LineChart
                              data={pricingCurve[key]}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 110,
                                bottom: 110,
                              }}>
                              <CartesianGrid vertical={false} horizontal strokeDasharray="3 3" />
                              <XAxis
                                domain={[
                                  pricingCurve[key][0].name,
                                  pricingCurve[key][pricingCurve[key].length - 1].name,
                                ]}
                                axisLine={false}
                                interval={getInterval(pricingCurve[key])}
                                dataKey="name"
                                label={{ value: getRangeName(key), position: 'bottom', offset: 40 }}
                              />
                              <YAxis
                                domain={getYaxisValues(pricingCurve[key])}
                                tickCount={12}
                                axisLine={false}
                                label={{ value: 'Total', angle: -90, position: 'left', offset: 60 }}
                              />
                              <Tooltip />
                              {rangeWiseTiers[key]?.map((item: any) => {
                                if (item.checked) {
                                  return (
                                    <Line
                                      key={item.tier_id}
                                      dot={false}
                                      strokeWidth={4}
                                      stroke={item.color}
                                      type="monotone"
                                      dataKey={item.tier_name}
                                    />
                                  );
                                }
                                return null;
                              })}
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </Grid>
                      <Grid sx={pageStyle.rightContainer} item md={3} lg={3} xs={3}>
                        <Box sx={pageStyle.tiersContainer}>
                          {rangeWiseTiers[key]?.map((item: any, i: number) => {
                            return (
                              <>
                                <Box sx={pageStyle.checkboxContainer} key={item.tier_id}>
                                  <FormControlLabel
                                    sx={pageStyle.formLabel}
                                    control={
                                      <Checkbox
                                        checked={item.checked}
                                        onChange={(event) => handleChange(event, i, key)}
                                        sx={pageStyle.checkboxStyle}
                                      />
                                    }
                                    label={
                                      <Box sx={pageStyle.checkboxLabelStyle}>{item.tier_name}</Box>
                                    }
                                  />
                                  <Box sx={{ color: item.color, fontSize: '2.5rem' }}>&#8226;</Box>
                                </Box>
                                {getUserAddOnDetails(item.tier_id)
                                  ? `[${getUserAddOnDetails(item.tier_id)}]`
                                  : null}
                              </>
                            );
                          })}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      ) : null}
      {open && (
        <AddonConfigDialog
          data={addonConfig}
          open={open}
          handleSave={() => {
            setOpen(false);
            getPricingCurve(addonConfig, selectedTiers);
          }}
          handleClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
};
export default injectIntl(PriceCurve);
