import {
  Box,
  Button,
  Checkbox,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import _ from 'lodash';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

const AddOnsTable: React.FC<any> = ({
  rows,
  columns,
  handleFormValueChange,
  onClickNewMetric,
}): ReactElement => {
  const fields = columns.map((c: any) => c.field);
  const widths = columns.map((c: any) => c.width);
  return (
    <Grid container width="102%">
      {columns.map((c: any) => {
        return (
          <Grid
            item
            sx={{
              display: 'inline-block',
              verticalAlign: 'top',
              width: c.width,
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}>
            <Typography
              sx={{
                fontFamily: 'Helvetica',
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '14px',
                lineHeight: '16px',
                color: '#000000',
                margin: '30px 48px',
                textAlign: 'center',
              }}>
              {c.headerName}
            </Typography>
          </Grid>
        );
      })}
      {_.isEmpty(rows) ? (
        <Box sx={{ width: 'inherit', textAlign: 'center', padding: '10px' }}>
          <Typography sx={{ textAlign: 'center' }}>
            <FormattedMessage id="noAddonsMessage" />
          </Typography>
        </Box>
      ) : (
        rows.map((r: any) => {
          return fields.map((f: any, index: number) => {
            return (
              <Grid
                item
                sx={{
                  display: 'inline-block',
                  verticalAlign: 'top',
                  width: widths[index],
                  backgroundColor: 'white',
                  textAlign: 'center',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                }}>
                {f === 'addOnFeatures' && (
                  <Typography
                    sx={{
                      fontFamily: 'Helvetica',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '36px',
                      color: '#000000',
                      margin: '30px 48px',
                      textAlign: 'left',
                    }}>
                    {r[f]}
                  </Typography>
                )}
                {f === 'model' && r.model !== 'Create new metrics' ? (
                  <FormControl fullWidth sx={{ margin: '20px', width: '75%', textAlign: 'left' }}>
                    <InputLabel>
                      <FormattedMessage id="selectModel" />
                    </InputLabel>
                    <Select
                      value={r[f]}
                      fullWidth
                      onChange={(e) => {
                        const { value } = e.target;
                        handleFormValueChange(r, 'model', value);
                      }}
                      label={<FormattedMessage id="selectModel" />}>
                      {[
                        // get list from API
                        { name: 'Fixed Price', id: 1 },
                        { name: 'Proportion of core model', id: 2 },
                        { name: 'Create new metrics', id: 3 },
                      ].map((p: any) => {
                        return (
                          <MenuItem key={p.id} value={p.name}>
                            {p.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                ) : null}
                {f === 'model' &&
                (r.model === 'Create new metrics' || !_.isEmpty(r.metric_name)) ? (
                  <Button sx={{ margin: '20px' }} onClick={() => onClickNewMetric(r)}>
                    {r?.metric_name}
                  </Button>
                ) : null}
                {f === 'fee' &&
                (r.model === 'Fixed Price' || r.model === 'Proportion of core model') ? (
                  <TextField
                    label="Fee"
                    variant="outlined"
                    type="number"
                    value={r[f]}
                    InputProps={{
                      inputProps: {
                        min: 0,
                      },
                    }}
                    sx={{ margin: '20px', width: '75%' }}
                    onChange={(e) => {
                      e.preventDefault();
                      const { value } = e.target;
                      handleFormValueChange(r, 'fee', `${value}`);
                    }}
                  />
                ) : null}
                {f === 'min' && r.model === 'Proportion of core model' ? (
                  <TextField
                    label="Min"
                    type="number"
                    variant="outlined"
                    value={r[f]}
                    InputProps={{
                      inputProps: {
                        min: 0,
                      },
                    }}
                    sx={{ margin: '20px' }}
                    onChange={(e) => {
                      e.preventDefault();
                      const { value } = e.target;
                      handleFormValueChange(r, 'min', `${value}`);
                    }}
                  />
                ) : null}
                {f === 'max' && r.model === 'Proportion of core model' ? (
                  <TextField
                    label="Max"
                    type="number"
                    variant="outlined"
                    value={r[f]}
                    InputProps={{
                      inputProps: {
                        min: 0,
                      },
                    }}
                    sx={{ margin: '20px', width: '75%' }}
                    onChange={(e) => {
                      e.preventDefault();
                      const { value } = e.target;
                      handleFormValueChange(r, 'max', `${value}`);
                    }}
                  />
                ) : null}
                {f === 'sell_multiple' && r.model !== 'Create new metrics' && (
                  <Checkbox
                    checked={r.sell_multiple}
                    onChange={() => handleFormValueChange(r, 'sell_multiple', !r.sell_multiple)}
                    sx={{
                      margin: '20px',
                      color: '#5D5FEF',
                      '&.Mui-checked': {
                        color: '#5D5FEF',
                      },
                    }}
                  />
                )}
              </Grid>
            );
          });
        })
      )}
    </Grid>
  );
};

export default AddOnsTable;
