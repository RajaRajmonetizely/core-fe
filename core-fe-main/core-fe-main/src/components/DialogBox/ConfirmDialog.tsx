import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import React, { ReactElement } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { FormattedMessage } from 'react-intl';
import styles from '../../styles/styles';
import './DialogBox.scss';

interface DialogConfig {
  dialogConfig: {
    name: string;
    text: string;
    open: boolean;
    loader: boolean;
    handleConfirm: any;
    handleCancel: any;
  };
}

const componentsStyle = {
  headerTitle: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: '1.3rem',
  },
  closeIconStyle: {
    marginLeft: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
    cursor: 'pointer',
  },
  titleContainer: {
    display: 'flex',
  },
};

const ConfirmDialog: React.FC<DialogConfig> = ({
  dialogConfig = {
    name: '',
    text: '',
    open: false,
    loader: false,
    handleConfirm: () => {},
    handleCancel: () => {},
  },
}): ReactElement => {
  return (
    <Dialog
      onClose={(event: any, reason: string) => {
        if (reason === 'backdropClick') {
          dialogConfig.handleCancel();
        }
      }}
      open={dialogConfig?.open}
      maxWidth="sm">
      <DialogTitle>
        <Box sx={componentsStyle.titleContainer}>
          <Box sx={componentsStyle.headerTitle}>
            <FormattedMessage id={dialogConfig?.name} />
          </Box>
          <CloseIcon onClick={dialogConfig.handleCancel} sx={componentsStyle.closeIconStyle} />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography>
          <FormattedMessage id={dialogConfig?.text} />
        </Typography>
        <DialogActions>
          <Button sx={styles.dialogButton} onClick={dialogConfig?.handleCancel}>
            <FormattedMessage id="cancel" />
          </Button>
          <Button sx={styles.dialogButton} onClick={dialogConfig?.handleConfirm}>
            {dialogConfig.loader ? (
              <CircularProgress sx={{ color: 'white' }} size={24} />
            ) : (
              <FormattedMessage id="confirm" />
            )}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
