import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import React, { ReactElement } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import styles from '../../styles/styles';

interface AddonConfig {
  data: any;
  open: boolean;
  onSetColumn: (columns: any) => void;
  handleSave: any;
  intl: any;
}

const componentsStyle = {
  headerTitle: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: '1.3rem',
  },
  prodHeading: {
    fontWeight: '700',
    lineHeight: '18px',
    color: '#3b3f4d',
    textTransform: 'capitalize',
    paddingBottom: '19px',
    paddingTop: '19px',
  },
  titleContainer: {
    display: 'flex',
  },
};

const MetricDialog: React.FC<AddonConfig> = ({
  data,
  open,
  intl,
  handleSave,
  onSetColumn,
}): ReactElement => {
  const disableButton = () => {
    if (data) {
      const filterData = data.filter((item: any) => !item.columnType);
      if (filterData?.length > 0) {
        return true;
      }
    }
    return false;
  };

  return (
    <Dialog fullWidth open={open} maxWidth="sm">
      <DialogTitle>
        <Box sx={componentsStyle.titleContainer}>
          <Box sx={componentsStyle.headerTitle}>
            {intl.formatMessage({ id: 'manageMetricColumn' })}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {data.map((col: any, i: number) => {
          return (
            <Box key={col.id}>
              <Typography sx={componentsStyle.prodHeading}>
                {col.name} {intl.formatMessage({ id: 'columnType' })}
              </Typography>
              <FormControl sx={{ width: '100%' }}>
                <Select
                  id="demo-simple-select"
                  name={col.name}
                  fullWidth
                  onChange={(event) => {
                    const { value } = event.target;
                    const tempArray = JSON.parse(JSON.stringify(data));
                    tempArray[i].columnType = value;
                    onSetColumn(tempArray);
                  }}>
                  {[{ name: 'normal' }, { name: 'range' }, { name: 'upto' }].map((option: any) => {
                    return (
                      <MenuItem key={uuidv4()} value={option.name}>
                        <FormattedMessage id={option.name} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button disabled={disableButton()} sx={styles.dialogButton} onClick={() => handleSave()}>
          <FormattedMessage id="save" />
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default injectIntl(MetricDialog);
