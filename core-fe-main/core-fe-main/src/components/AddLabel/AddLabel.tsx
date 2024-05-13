import { Box } from '@mui/material';
import React from 'react';
import { injectIntl } from 'react-intl';
import { ReactComponent as PlusIcon } from '../../assets/icons/plus.svg';

interface IProps {
  onClick: () => void;
  intl: any;
  label: string;
}

const pageStyles = {
  purpleText: {
    color: '#5D5FEF',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '14px',
  },
};

const AddLabel: React.FC<IProps> = ({ intl, label, onClick }) => {
  return (
    <Box
      onClick={onClick}
      sx={{ display: 'flex', cursor: 'pointer', marginTop: 'auto', marginBottom: 'auto' }}>
      <Box sx={{ marginRight: '6px' }}>
        <PlusIcon />
      </Box>
      <Box sx={pageStyles.purpleText}>{intl.formatMessage({ id: label })}</Box>
    </Box>
  );
};
export default injectIntl(AddLabel);
