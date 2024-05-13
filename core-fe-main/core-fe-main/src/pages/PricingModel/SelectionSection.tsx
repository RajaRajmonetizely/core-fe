import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import React, { ReactElement, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { IMetrics } from '../../models/pricing-model';
import { updatePricingMetrics } from '../../store/pricing_model/pricingModel.slice';

const styles = {
  sectionName: {
    color: '#3B3F4D',
    marginBottom: '14px',
    fontFamily: 'Helvetica',
    fontWeight: '700',
  },
  sectionBox: {
    display: 'inline-block',
    width: '300px',
    verticalAlign: 'top',
  },
};
const SelectionSection: React.FC<any> = ({
  intl,
  priceMetric,
  priceStructure,
  priceModelVersion,
  selectedTier,
  setPriceMetric,
  setPricingStructure,
  setPricingModelVersion,
  setSelectedTier,
  tiers = [],
  displayConfig = {
    showPricingMetric: true,
    showPricingStructure: true,
    showPricingModelVersion: true,
    showTiers: false,
  }, // all three parameters can be passed as config
}): ReactElement => {
  const dispatch = useDispatch();
  const pricingStructure = useSelector((state: any) => state.pricingModel.pricingStructure);
  const pricingMetrics = useSelector((state: any) => state.pricingModel.pricingMetrics);
  const pricingModels = useSelector((state: any) => state.pricingModel.pricingModels);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  const createNewMetrics = async (data: IMetrics[]) => {
    if (data) {
      const filterData = data.filter((item) => item.inputValue);
      if (filterData.length > 0 && !filterData[0].id && filterData[0].inputValue) {
        try {
          const input = Number(filterData[0].inputValue);
          if (Number.isNaN(input)) {
            const response = await PricingModelClient.createMetrics({
              name: filterData[0].inputValue,
            });
            if (response.message === 'success') {
              dispatch(updatePricingMetrics(response.data));
              const filterMetric = data.filter((item) => !item.inputValue);
              setPriceMetric([...filterMetric, response.data]);
            }
          } else {
            setSnackBarValues({
              display: true,
              type: 'error',
              message: intl.formatMessage({ id: 'rejectOnlyNumbers' }),
            });
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        if (data.length === 2 && data[0].id === data[1].id) {
          data.splice(0);
        }
        setPriceMetric(data);
      }
    }
    return null;
  };

  return (
    <Grid container>
      <Grid item md={12}>
        <Paper sx={{ minHeight: '120px', padding: '18px 33px' }}>
          {displayConfig.showPricingMetric ? (
            <Box sx={styles.sectionBox}>
              <Typography sx={styles.sectionName}>
                <FormattedMessage id="pricingMetric" />
              </Typography>
              <FormControl sx={{ m: 1, minWidth: 245 }}>
                <SearchAddAutocomplete
                  caption="pricingMetric"
                  data={pricingMetrics}
                  multiselect
                  selectedItem={priceMetric}
                  setSelectedData={createNewMetrics}
                  showSelectionValue
                />
              </FormControl>
            </Box>
          ) : null}
          {displayConfig.showPricingStructure ? (
            <Box sx={styles.sectionBox}>
              <Typography sx={styles.sectionName}>
                <FormattedMessage id="pricingStructure" />
              </Typography>
              <FormControl sx={{ m: 1, width: 245 }}>
                <InputLabel id="select-pricing-structure">
                  <FormattedMessage id="pricingStructure" />
                </InputLabel>
                <Select
                  labelId="select-pricing-structure"
                  id="pricingstructureselect"
                  value={priceStructure ?? ''}
                  onChange={(e: any) => {
                    const { value } = e.target;
                    setPricingStructure(value);
                  }}
                  label={<FormattedMessage id="pricingStructure" />}>
                  {pricingStructure.map((rep: any) => (
                    <MenuItem
                      disabled={rep.name !== 'Custom' && priceMetric?.length > 1}
                      key={rep.id}
                      value={rep}>
                      {rep.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : null}

          {displayConfig.showPricingModelVersion ? (
            <Box sx={styles.sectionBox}>
              <Typography sx={styles.sectionName}>
                <FormattedMessage id="pricingModelVersion" />
              </Typography>
              <FormControl sx={{ m: 1, width: 245 }}>
                <InputLabel id="select-pricing-model-version">
                  <FormattedMessage id="pricingModelVersion" />
                </InputLabel>
                <Select
                  labelId="select-pricing-model-version"
                  id="pricing-model-version-select"
                  value={priceModelVersion ?? ''}
                  onChange={(e: any) => {
                    const { value } = e.target;
                    setPricingModelVersion(value);
                  }}
                  label={<FormattedMessage id="pricingModelVersion" />}>
                  {pricingModels.map((rep: any) => (
                    <MenuItem key={rep.id} value={rep}>
                      {rep.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : null}
          {displayConfig.showTiers ? (
            <Box sx={styles.sectionBox}>
              <Typography sx={styles.sectionName}>
                <FormattedMessage id="tiers" />
              </Typography>
              <FormControl sx={{ m: 1, width: 245 }}>
                <InputLabel id="select-pricing-model-version">
                  <FormattedMessage id="tiers" />
                </InputLabel>
                <Select
                  labelId="select-pricing-model-version"
                  id="pricing-model-version-select"
                  value={selectedTier ?? ''}
                  onChange={(e: any) => {
                    const { value } = e.target;
                    setSelectedTier(value);
                  }}
                  label={<FormattedMessage id="tiers" />}>
                  {tiers.map((rep: any) => (
                    <MenuItem key={rep.tier_id} value={rep}>
                      {rep.tier_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : null}
        </Paper>
      </Grid>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </Grid>
  );
};

export default injectIntl(SelectionSection);
