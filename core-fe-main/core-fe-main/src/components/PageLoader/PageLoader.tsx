import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const componentStyle = {
  container: {
    marginTop: '100px',
    marginBottom: '100px',
    textAlign: 'center',
  },
};

const PageLoader = () => {
  return (
    <Box sx={componentStyle.container}>
      <CircularProgress size={38} />
    </Box>
  );
};
export default PageLoader;
