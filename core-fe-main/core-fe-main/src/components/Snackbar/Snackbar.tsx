import React from 'react';
import { Alert, Snackbar as SnackbarMUI } from '@mui/material';
import { SnackbarProps } from './SnackbarTypes';

const Snackbar: React.FC<SnackbarProps> = ({ type = 'error', display, message, onClose }) => {
  return (
    <SnackbarMUI
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={display}
      autoHideDuration={5000}
      onClose={onClose}>
      <Alert onClose={onClose} variant="filled" severity={type} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </SnackbarMUI>
  );
};

export default Snackbar;
