import { Box, Tab, Tabs } from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import Breadcrumbs from '../../components/BreadCrumbs/BreadCrumbs';
import PageLoader from '../../components/PageLoader/PageLoader';
import Snackbar from '../../components/Snackbar/Snackbar';
import TabPanel from '../../components/TabPanel/TabPanel';
import { finalOutputColumn } from '../../constants/constants';
import { ISnackBar } from '../../models/common';
import { ICoreDetails, IPricingModel, IPricingStructure } from '../../models/pricing-model';
import {
  setCoreTierDetails,
  setCustomTabData,
  setModelDetails,
  setPricingMetrics,
  setPricingModel,
  setPricingModelTabs,
  setPricingStructure,
  setSelectedPriceStructure,
  setSelectedPricingModel,
  setSelectedTabValue,
} from '../../store/pricing_model/pricingModel.slice';
import styles from '../../styles/styles';
import CustomAddOn from './CustomAddOn';
import tabs from './PricingModelCostants';

interface IProps {
  intl: any;
}

const PricingModel: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const selectedTabValue = useSelector((state: any) => state.pricingModel.selectedTabValue);
  const selectedPricingModel: IPricingModel = useSelector(
    (state: any) => state.pricingModel.selectedPricingModel,
  );
  const selectedPriceStructure: IPricingStructure = useSelector(
    (state: any) => state.pricingModel.selectedPriceStructure,
  );
  const pricingStructure = useSelector((state: any) => state.pricingModel.pricingStructure);
  const modelDetails = useSelector((state: any) => state.pricingModel.modelDetails);
  const { modelId } = useParams();
  const tabList = useSelector((state: any) => state.pricingModel.pricingModelTabs);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [loader, setLoader] = useState(false);
  const [loadingPricingMetric, setLoadingPricingMetric] = useState(false);

  const getTabsList = (model: any) => {
    const addonsAr: any = [];
    model?.details?.forEach((t: any) => {
      t?.details?.addons?.forEach((ad: any) => {
        if (ad?.is_custom_metric) {
          dispatch(setCustomTabData({ [ad.id]: ad }));
          addonsAr.push({
            label: ad.metric_name,
            id: ad.id,
            tierId: t.tier_id,
            component: <CustomAddOn addonId={ad.id} tierId={t.tier_id} />,
          });
        }
      });
    });
    if (addonsAr.length) {
      const tabAr = [...tabs];
      tabAr.splice(-2, 0, ...addonsAr);
      dispatch(setPricingModelTabs(tabAr));
    } else dispatch(setPricingModelTabs(tabs));
  };

  useEffect(() => {
    dispatch(setPricingModelTabs(tabs));
    getPricingStructure();
    getPricingMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPricingModel && selectedPricingModel.details) getTabsList(selectedPricingModel);
    // eslint-disable-next-line
  }, [selectedPricingModel]);

  useEffect(() => {
    if (
      modelDetails &&
      modelDetails.details &&
      selectedPriceStructure &&
      selectedPriceStructure.id
    ) {
      const columns: any = [];
      selectedPriceStructure.details.map((col: any) => {
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
      const generateData: ICoreDetails[] = [];
      modelDetails.details.map((item: any) => {
        generateData.push({
          pricing_model_detail_id: item.pricing_model_detail_id,
          addons: item.details.addons ?? [],
          core:
            selectedPriceStructure.id === modelDetails.pricing_structure_id && item.details.core
              ? item.details.core
              : {
                  columns:
                    selectedPriceStructure.name === 'Custom' ? [{ ...finalOutputColumn }] : columns,
                  values: new Array(1).fill({}),
                },
        } as ICoreDetails);
        return null;
      });
      dispatch(setCoreTierDetails(generateData));
    }
    // eslint-disable-next-line
  }, [selectedPriceStructure, modelDetails]);

  useEffect(() => {
    getDetailsByModelId();
    // eslint-disable-next-line
  }, [modelId]);

  useEffect(() => {
    if (modelDetails && modelDetails.package_id) {
      getPricingModel(modelDetails.package_id);
    }
    // eslint-disable-next-line
  }, [modelDetails]);

  const getPricingStructure = async () => {
    if (ability.can('GET', 'Pricing Model'))
      try {
        const response = await PricingModelClient.getPricingStructure();
        if (response) {
          dispatch(setPricingStructure(response));
        }
      } catch (e) {
        console.error(e);
      }
  };

  const getDetailsByModelId = async () => {
    if (ability.can('GET', 'Pricing Model'))
      try {
        setLoader(true);
        const response = await PricingModelClient.getDetailsByModelId(modelId as string);
        if (response.message === 'success') {
          if (!response.data.pricing_structure_id) {
            dispatch(setSelectedPriceStructure({}));
            dispatch(setSelectedPricingModel([]));
            dispatch(setCoreTierDetails([]));
          }
          dispatch(setModelDetails(response.data));
          // dispatch(setSelectedPricingModel(response.data));
        }
        setLoader(false);
      } catch (e) {
        setLoader(false);
      }
  };

  const getPricingModel = async (packageId: string) => {
    if (ability.can('GET', 'Pricing Model'))
      try {
        const response = await PricingModelClient.getPricingModel(packageId);
        if (response.message === 'success') {
          dispatch(setPricingModel(response.data));
        }
      } catch (e) {
        console.error(e);
      }
  };

  const getPricingMetrics = async () => {
    if (ability.can('GET', 'Pricing Model'))
      try {
        setLoadingPricingMetric(true);
        const response = await PricingModelClient.getPricingMetrics();
        if (response.message === 'success') {
          dispatch(setPricingMetrics(response.data));
        }
        setLoadingPricingMetric(false);
      } catch (e) {
        console.error(e);
      }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue !== 0) {
      if (!modelDetails.pricing_structure_id) {
        setSnackBarValues({
          display: true,
          type: 'error',
          message: intl.formatMessage({ id: 'pleaseEnterCoreData' }),
        });
        return true;
      }
    }
    dispatch(setSelectedTabValue(newValue));
    return null;
  };

  return (
    <>
      <Breadcrumbs />
      <Box
        sx={{
          width: '98%',
          height: '72px',
          background: '#F4F6FE',
          border: '1px solid #E2E8F0',
          boxShadow: '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)',
          borderRadius: '10px 10px 0px 0px',
        }}
        alignItems="center">
        <Tabs
          variant="scrollable"
          scrollButtons
          value={selectedTabValue}
          onChange={handleChange}
          aria-label="basic tabs example"
          textColor="secondary"
          indicatorColor="secondary"
          sx={{ marginTop: '20px' }}>
          {tabList.map((t: any) => {
            return <Tab sx={styles.tabLabelStyle} key={uuidv4()} label={t.label} />;
          })}
        </Tabs>
      </Box>

      {
        // eslint-disable-next-line
        loader || pricingStructure.length == 0 || loadingPricingMetric ? <PageLoader /> : null
      }
      {!loader &&
        pricingStructure.length > 0 &&
        !loadingPricingMetric &&
        tabList.map((t: any, index: number) => {
          return (
            /* eslint-disable react/no-array-index-key */
            <TabPanel key={index} value={selectedTabValue} index={index}>
              {t.component}
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
    </>
  );
};
export default injectIntl(PricingModel);
