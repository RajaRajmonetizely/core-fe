import { Box, Button, CircularProgress, Tab, Tabs } from '@mui/material';
import _ from 'lodash';
import React, { ReactElement, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import * as Yup from 'yup';
import PackageClient from '../../api/Package/PackageAPIs';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import DialogBox from '../../components/DialogBox/DialogBox';
import PageLoader from '../../components/PageLoader/PageLoader';
import Snackbar from '../../components/Snackbar/Snackbar';
import TabPanel from '../../components/TabPanel/TabPanel';
import { getMetricFields } from '../../constants/dialogBoxConstants';
import { ISnackBar } from '../../models/common';
import { IAddOnDetails, ICoreData, IMetrics } from '../../models/pricing-model';
import {
  setCustomTabData,
  setModelDetails,
  setPricingModelTabs,
  setSelectedTabValue,
  setTierWiseAddOnValues,
  updatePricingModelTabs,
} from '../../store/pricing_model/pricingModel.slice';
import commonStyle from '../../styles/commonStyle';
import styles from '../../styles/styles';
import { REGEX } from '../../utils/helperService';
import './AddOns.scss';
import { getColumns } from './AddOnsConstants';
import AddOnsTable from './AddOnsTable';
import CustomAddOn from './CustomAddOn';

const componentStyle = {
  btnContainer: {
    textAlign: 'right',
    marginTop: '18px',
  },
};
const AddOns: React.FC<any> = (): ReactElement => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { modelId } = useParams();
  const ability = useSelector((state: any) => state.auth.ability);
  const modelDetails = useSelector((state: any) => state.pricingModel.modelDetails);
  const selectedPricingModel = useSelector((state: any) => state.pricingModel.selectedPricingModel);
  const selectedPriceMetric = useSelector((state: any) => state.pricingModel.selectedPriceMetric);
  const tierWiseAddOnValues = useSelector((state: any) => state.pricingModel.tierWiseAddOnValues);
  const customTabData = useSelector((state: any) => state.pricingModel.customTabData);
  const selectedPriceStructure = useSelector(
    (state: any) => state.pricingModel.selectedPriceStructure,
  );

  const tabList = useSelector((state: any) => state.pricingModel.pricingModelTabs);
  const [value, setValue] = React.useState(0);
  const [showLoader, setLoader] = useState(false);
  const [open, toggleOpen] = React.useState(false);
  const [metric, setMetric] = React.useState<any>();
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const [packageLoader, setPackageLoader] = useState(false);

  useEffect(() => {
    getPackageDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelDetails]);

  useEffect(() => {
    const generatedTabs: any = [];
    tabList.map((item: any) => {
      if (item.tierId && tierWiseAddOnValues[item.tierId]) {
        const findFeature = tierWiseAddOnValues[item.tierId].findIndex(
          (feature: any) => feature.id === item.id && feature.model,
        );
        if (findFeature > -1) {
          generatedTabs.push(item);
        }
      } else {
        generatedTabs.push(item);
      }
      return null;
    });
    if (JSON.stringify(generatedTabs) !== JSON.stringify(tabList)) {
      dispatch(setPricingModelTabs(generatedTabs));
    }
    // eslint-disable-next-line
  }, [tabList, tierWiseAddOnValues]);

  const getPackageDetails = () => {
    if (modelDetails?.package_id) setPackageLoader(true);
    PackageClient.getPackageById(modelDetails?.package_id)
      .then(({ data }) => {
        const addOns: any = {};
        data.forEach((t: any) => {
          const addonList: any = [];
          t.details?.feature_groups?.forEach((fgr: any) => {
            fgr?.features
              .filter((f: any) => f.is_addon)
              ?.forEach((f: any) => {
                let existingFeatures: any = {};
                if (modelDetails.details) {
                  const tierData = modelDetails.details.find(
                    (tier: any) => tier.tier_id === t.tier_id,
                  );
                  existingFeatures = tierData.details?.addons?.find(
                    (ft: any) => ft.id === f.feature_id,
                  );
                }
                addonList.push({
                  tier_id: t.tier_id,
                  id: f.feature_id,
                  tier_name: t.tier_name,
                  addOnFeatures: f.name,
                  metric_name: existingFeatures?.metric_name || '',
                  model: existingFeatures?.is_custom_metric
                    ? 'Create new metrics'
                    : existingFeatures?.details?.model || '',
                  fee: existingFeatures?.details?.fee || '',
                  min: existingFeatures?.details?.min || null,
                  max: existingFeatures?.details?.max || null,
                  sell_multiple: existingFeatures?.details?.sell_multiple || false,
                });
              });
          });
          addOns[t.tier_id] = addonList;
        });
        dispatch(setTierWiseAddOnValues(addOns));
        setPackageLoader(false);
      })
      .catch((e) => {
        console.error(e);
        setPackageLoader(false);
      });
  };

  const handleFormValueChange = (row: any, key: string, newValue: any) => {
    const initValues = { fee: 0, min: 0, max: 0 };
    const currentRowId = tierWiseAddOnValues[row.tier_id].findIndex((t: any) => t.id === row.id);
    if (currentRowId !== -1) {
      if (key === 'model' && newValue === 'Create new metrics') {
        setMetric({
          name: '',
          tierId: row.tier_id,
          rowId: currentRowId,
          tierName: row.tier_name,
          featureId: row.id,
        });
        toggleOpen(true);
      }
      //   // eslint-disable-next-line prefer-const
      const tier = [...tierWiseAddOnValues[row.tier_id]];
      tier[currentRowId] = {
        ...tierWiseAddOnValues[row.tier_id][currentRowId],
        [key]: newValue,
      };
      if (key === 'model' && newValue !== 'Create new metrics') {
        tier[currentRowId] = { ...tier[currentRowId], ...initValues };
      }
      const tierValues = { ...tierWiseAddOnValues, ...{ [row.tier_id]: tier } };
      dispatch(setTierWiseAddOnValues(tierValues));
    }
  };

  const handleDialogClose = () => {
    setMetric({
      name: '',
      tierId: '',
      rowId: '',
      tierName: '',
      featureId: '',
    });
    toggleOpen(false);
  };

  const handleCreateNewMetric = () => {
    let error = false;
    const tabValue = {
      label: `${metric.tierName}-${metric.name}`,
      id: metric.featureId,
      tierId: metric.tierId,
      component: <CustomAddOn addonId={metric.featureId} tierId={metric.tierId} />,
    };
    tabList.forEach((tab: any) => {
      if (
        tab.tierId === tabValue.tierId &&
        tab.label.toUpperCase() === tabValue.label.toUpperCase()
      ) {
        error = true;
      }
    });
    if (error) {
      setSnackBarValues({ type: 'error', display: true, message: 'Model names cannot be same' });
      return;
    }
    const tier = [...tierWiseAddOnValues[metric.tierId]];
    tier[metric.rowId] = {
      ...tierWiseAddOnValues[metric.tierId][metric.rowId],
      metric_name: tabValue.label,
    };
    const tierValues = { ...tierWiseAddOnValues, ...{ [metric.tierId]: tier } };
    dispatch(setTierWiseAddOnValues(tierValues));
    dispatch(
      setCustomTabData({
        [metric.featureId]: {
          columns: [],
          id: metric.featureId,
          is_custom_metric: true,
          metric_name: tabValue.label,
          values: [],
          metric_details: [],
          pricing_structure_id: '',
        },
      }),
    );
    dispatch(updatePricingModelTabs(tabValue));

    handleDialogClose();
  };

  const handleCancel = () => {
    // eslint-disable-next-line prefer-const
    let tier = [...tierWiseAddOnValues[metric.tierId]];
    tier[metric.rowId] = {
      ...tierWiseAddOnValues[metric.tierId][metric.rowId],
      model: '',
    };
    const tierValues = { ...tierWiseAddOnValues, ...{ [metric.tierId]: tier } };
    dispatch(setTierWiseAddOnValues(tierValues));

    handleDialogClose();
  };

  const getAddOnsOb = () => {
    const body: ICoreData = {} as ICoreData;
    body.metric_details = selectedPriceMetric.map((metricData: IMetrics) => metricData.id);
    body.pricing_structure_id = selectedPriceStructure.id;
    body.details = [];
    _.keys(tierWiseAddOnValues).forEach((t) => {
      const ob = modelDetails?.details.find((tier: any) => tier.tier_id === t);
      const addons: IAddOnDetails[] = [];
      tierWiseAddOnValues[t].forEach((ad: any) => {
        const addonOb = {
          id: ad.id,
          addOnFeatures: ad.addOnFeatures,
          is_custom_metric: ad.model === 'Create new metrics',
        };
        if (ad.model !== 'Create new metrics') {
          addons.push({
            ...addonOb,
            details: {
              model: ad.model,
              fee: ad.fee,
              min: ad.min,
              max: ad.max,
              sell_multiple: ad.sell_multiple,
            },
          });
        } else {
          addons.push({
            ...addonOb,
            metric_name: ad.metric_name,
            columns: customTabData[ad.id]?.columns || [],
            values: customTabData[ad.id]?.values || [],
            metric_details: customTabData[ad.id]?.metric_details || [],
            pricing_structure_id: customTabData[ad.id]?.pricing_structure_id || '',
          });
        }
      });
      const filterData = addons.filter((item) => {
        if (item.details) return item.details.model;
        return item.is_custom_metric;
      });
      body.details.push({
        ...ob?.details,
        addons: filterData,
        pricing_model_detail_id: ob?.pricing_model_detail_id,
      });
    });
    body.details.forEach((detail: any) => {
      if (detail.addons) {
        detail.addons.forEach((adb: any) => {
          if (adb.is_custom_metric && adb.metric_details) {
            adb.metric_details = adb.metric_details.map((metricA: any) => metricA.id || metricA);
          }
        });
      }
    });
    return body;
  };

  const validateField = () => {
    let isValidate = true;
    tierWiseAddOnValues[selectedPricingModel?.details[value].tier_id].map((item: any) => {
      if (isValidate) {
        if (
          !item.model ||
          (item.model === 'Fixed Price' && !item.fee) ||
          (item.model === 'Proportion of core model' && (!item.fee || !item.min || !item.max))
        ) {
          isValidate = false;
          setSnackBarValues({
            display: true,
            type: 'error',
            message: intl.formatMessage({ id: 'pleaseEnterAllValues' }),
          });
        } else if (
          item.model === 'Proportion of core model' &&
          Number(item.min) > Number(item.max)
        ) {
          isValidate = false;
          setSnackBarValues({
            display: true,
            type: 'error',
            message: intl.formatMessage({ id: 'minMaxValidation' }),
          });
        }
      }
      return null;
    });
    return isValidate;
  };

  const saveAddOns = async () => {
    try {
      if (validateField()) {
        setLoader(true);
        const response = await PricingModelClient.updateModelData(
          selectedPricingModel.id,
          getAddOnsOb(),
        );
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
        }
      }
    } catch (e) {
      setLoader(false);
    }
  };

  const onClickNewMetric = (row: any) => {
    const tab = tabList.findIndex((t: any) => t.label === row.metric_name);
    dispatch(setSelectedTabValue(tab));
  };

  return (
    <>
      {/* <SelectionSection
        displayConfig={{
          showPricingMetric: false,
          showPricingStructure: false,
          showPricingModelVersion: false,
        }}
      /> */}
      <Tabs
        value={value}
        onChange={handleChange}
        textColor="secondary"
        indicatorColor="secondary"
        sx={{ marginTop: '20px' }}>
        {selectedPricingModel?.details?.map((t: any) => {
          return (
            <Tab
              key={t.tier_id}
              label={t.tier_name}
              sx={{ borderBottom: '2px solid  #C3C3CF', ...styles.tabLabelStyle }}
            />
          );
        })}
      </Tabs>
      {packageLoader ? <PageLoader /> : null}

      {!packageLoader &&
        selectedPricingModel?.details?.map((t: any, index: number) => {
          return (
            <TabPanel value={value} index={index}>
              <AddOnsTable
                rows={!_.isEmpty(tierWiseAddOnValues) && tierWiseAddOnValues[t.tier_id]}
                columns={getColumns(handleFormValueChange, intl)}
                handleFormValueChange={handleFormValueChange}
                onClickNewMetric={onClickNewMetric}
              />
              <Box sx={componentStyle.btnContainer}>
                {ability.can('PUT', 'Pricing Model') ? (
                  <Button
                    disabled={tierWiseAddOnValues[t.tier_id]?.length === 0 || showLoader}
                    sx={commonStyle.button}
                    onClick={saveAddOns}>
                    {showLoader ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      intl?.formatMessage({ id: 'save' })
                    )}
                  </Button>
                ) : null}
              </Box>
            </TabPanel>
          );
        })}

      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
      {open && (
        <DialogBox
          dialogConfig={{
            name: 'createNewMetric',
            fields: getMetricFields(metric, setMetric),
            open,
            handleClose: handleCancel,
            handleSave: handleCreateNewMetric,
            initialValues: {
              name: metric.name ?? '',
            },
            schema: Yup.object({
              name: Yup.string()
                .trim()
                .matches(
                  REGEX,
                  'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
                )
                .required('Please enter metric name'),
            }),
          }}
        />
      )}
    </>
  );
};
export default AddOns;
