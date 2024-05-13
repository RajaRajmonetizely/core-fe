import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import commonStyle from '../../styles/commonStyle';

const componentStyle = {
  dialogHeader: {
    background: '#F27A54',
    display: 'flex',
    minWidth: '500px',
  },
  headerText: {
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: 'white',
  },
  closeIconStyle: {
    marginLeft: 'auto',
    marginTop: 'auto',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
  },
  inputStyle: {
    width: '100%',
    color: '#3B3F4D',
    fontFamily: 'Helvetica',
    fontWeight: 400,
    '& fieldset': { border: 'none' },
  },
  actionBtn: {
    borderTop: '1px solid #E5E5E5',
  },
  loaderStyle: {
    color: 'white',
  },
};

interface IProps {
  intl: any;
  open: boolean;
  loader: boolean;
  onSave: (value?: string) => void;
}

const NotesPopup: React.FC<IProps> = ({ intl, open, loader, onSave }) => {
  const [value, setValue] = useState('');
  return (
    <Dialog open={open}>
      <DialogTitle sx={componentStyle.dialogHeader}>
        <Box sx={componentStyle.headerText}>{intl.formatMessage({ id: 'addNote' })}</Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          placeholder={intl.formatMessage({ id: 'note' })}
          sx={componentStyle.inputStyle}
          multiline
          value={value}
          minRows={8}
          onChange={(e) => setValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={componentStyle.actionBtn}>
        <Button
          disabled={!value || loader}
          onClick={() => setValue('')}
          sx={commonStyle.greyButton}>
          {intl.formatMessage({ id: 'clear' })}
        </Button>
        <Button
          disabled={!value || loader}
          onClick={() => {
            onSave(value);
            setValue('');
          }}
          sx={commonStyle.blueButton}>
          {loader ? (
            <CircularProgress sx={componentStyle.loaderStyle} size={24} />
          ) : (
            intl.formatMessage({ id: 'save' })
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default injectIntl(NotesPopup);
