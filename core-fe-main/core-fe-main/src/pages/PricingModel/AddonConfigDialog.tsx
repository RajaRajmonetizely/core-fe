import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import _ from 'lodash';
import React, { ReactElement } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { setAddonConfigData } from '../../store/pricing_model/pricingModel.slice';
import styles from '../../styles/styles';

interface AddonConfig {
  data: any;
  open: boolean;
  handleSave: any;
  handleClose: any;
  intl: any;
}

const AddonConfigDialog: React.FC<AddonConfig> = ({
  data,
  open,
  handleSave,
  handleClose,
  intl,
}): ReactElement => {
  const dispatch = useDispatch();
  const addonConfig = useSelector((state: any) => state.pricingModel.addonConfig);

  const setData = (index: number, c: any, value: string, addonData?: any) => {
    const tempConfig = JSON.parse(JSON.stringify(addonConfig));
    if (tempConfig.values) {
      if (addonData) {
        if (!tempConfig.values[index][c.tier_id].addonUnits) {
          tempConfig.values[index][c.tier_id].addonUnits = {};
        }
        tempConfig.values[index][c.tier_id].addonUnits[addonData.metric_column.key] = Number(value);
      } else {
        tempConfig.values[index][c.tier_id].quantity = Number(value);
      }
    }
    dispatch(setAddonConfigData(tempConfig));
  };

  return (
    <Dialog open={open} maxWidth="lg">
      <DialogContent>
        <Box style={{ display: 'inline-table', overflowX: 'auto' }}>
          <Box style={{ display: 'flex' }}>
            {data?.columns.map((r: any) => {
              return (
                <Box
                  key={r.tier_id}
                  sx={{
                    lineHeight: '16px',
                    verticalAlign: 'top',
                    width: '300px',
                    backgroundColor: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}>
                  <Typography
                    sx={{
                      fontFamily: 'Helvetica',
                      fontStyle: 'normal',
                      fontWeight: 700,
                      width: '300px',
                      fontSize: '14px',
                      lineHeight: '16px',
                      color: '#000000',
                      margin: '20px 10px',
                      textAlign: 'center',
                    }}>
                    {r.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          {data.values.map((v: any, index: number) => {
            return (
              <Box key={v.id} style={{ display: 'flex', flexShrink: 0 }}>
                {data.columns.map((c: any) => {
                  return (
                    <Box
                      key={c.tier_id}
                      sx={{
                        display: 'flex',
                        lineHeight: '16px',
                        verticalAlign: 'top',
                        width: '300px',
                        backgroundColor: 'white',
                        textAlign: 'center',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                      }}>
                      {c.tier_id === 'addon' && (
                        <Typography
                          sx={{
                            fontFamily: 'Helvetica',
                            fontStyle: 'normal',
                            fontWeight: 700,
                            width: '100%',
                            fontSize: '14px',
                            lineHeight: '36px',
                            color: '#000000',
                            margin: '30px 48px',
                            textAlign: 'center',
                          }}>
                          {v.name}
                        </Typography>
                      )}
                      {v[c.tier_id] && v[c.tier_id].addon ? (
                        <Box sx={{ width: '300px', margin: '20px' }}>
                          {v[c.tier_id].addon.map((adb: any) => {
                            return Object.keys(adb).map((key) => {
                              return adb[key].map((addonData: any) => {
                                return (
                                  <Box>
                                    <Box
                                      sx={{
                                        textAlign: 'left',
                                        marginBottom: '12px',
                                        fontFamily: 'Helvetica',
                                        fontStyle: 'normal',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        color: '#000000',
                                      }}>
                                      {addonData.metric_column.name}
                                    </Box>
                                    <TextField
                                      key={addonData.metric_column.key}
                                      type="number"
                                      variant="outlined"
                                      value={
                                        v[c.tier_id] &&
                                        v[c.tier_id].addonUnits &&
                                        v[c.tier_id].addonUnits[addonData.metric_column.key]
                                          ? v[c.tier_id].addonUnits[addonData.metric_column.key]
                                          : ''
                                      }
                                      fullWidth
                                      placeholder={intl.formatMessage({ id: 'quantity' })}
                                      sx={{
                                        marginBottom: '12px',
                                        input: { textAlign: 'center' },
                                      }}
                                      onChange={(e) => {
                                        e.preventDefault();
                                        const { value } = e.target;
                                        setData(index, c, value, addonData);
                                      }}
                                    />
                                  </Box>
                                );
                              });
                            });
                          })}
                        </Box>
                      ) : (
                        // eslint-disable-next-line
                        <>
                          {_.has(v, c.tier_id) &&
                            c.tier_id !== 'addon' &&
                            (v[c.tier_id] && v[c.tier_id].sell_multiple ? (
                              <TextField
                                type="number"
                                variant="outlined"
                                value={
                                  v[c.tier_id] && v[c.tier_id].quantity !== undefined
                                    ? v[c.tier_id].quantity
                                    : ''
                                }
                                placeholder={intl.formatMessage({ id: 'quantity' })}
                                sx={{
                                  margin: '20px',
                                  width: '300px',
                                  input: { textAlign: 'center' },
                                }}
                                onChange={(e) => {
                                  e.preventDefault();
                                  const { value } = e.target;
                                  setData(index, c, value);
                                }}
                              />
                            ) : (
                              <Select
                                fullWidth
                                placeholder={intl.formatMessage({ id: 'quantity' })}
                                sx={{ margin: '20px', width: '300px', maxHeight: '56px' }}
                                value={
                                  v[c.tier_id] && v[c.tier_id].quantity !== undefined
                                    ? v[c.tier_id].quantity
                                    : ''
                                }
                                onChange={(e: any) => {
                                  const { value } = e.target;
                                  setData(index, c, value);
                                }}>
                                {[0, 1].map((p: any) => {
                                  return (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <MenuItem key={p} value={p}>
                                      {p}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            ))}
                        </>
                      )}
                      {!_.has(v, c.tier_id) && c.tier_id !== 'addon' && (
                        <Box
                          sx={{
                            display: 'flex',
                            lineHeight: '16px',
                            verticalAlign: 'top',
                            width: '300px',
                            backgroundColor: '#E5E5E575',
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button sx={styles.dialogButton} onClick={handleClose}>
          <FormattedMessage id="cancel" />
        </Button>
        <Button sx={styles.dialogButton} onClick={() => handleSave()}>
          <FormattedMessage id="save" />
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default injectIntl(AddonConfigDialog);
