import { Box, CircularProgress } from '@mui/material';
import React, { ReactElement } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import { injectIntl } from 'react-intl';
import { ReactComponent as SaveIcon } from '../../assets/icons/save.svg';

interface IProps {
  placeholder: string;
  btnText: string;
  intl: any;
  value: any;
  showProgress: boolean;
  onTextChange: (value: any) => void;
  onClick: () => void;
}

const SaveInput: React.FC<IProps> = ({
  intl,
  placeholder,
  btnText,
  value = '',
  showProgress,
  onTextChange,
  onClick,
}): ReactElement => {
  return (
    <Box sx={{ display: 'flex', marginLeft: '150px', marginTop: '50px', marginBottom: '50px' }}>
      <OutlinedInput
        onChange={onTextChange}
        value={value}
        sx={{ height: '48px', borderRadius: '10px 0px 0px 10px' }}
        placeholder={intl.formatMessage({ id: placeholder })}
      />
      <Box
        sx={{
          height: '48px',
          background: '#5D5FEF',
          color: 'white',
          minWidth: '150px',
          borderRadius: '0px 10px 10px 0px',
          cursor: 'pointer',
          fontFamily: 'Helvetica',
          fontStyle: 'normal',
          fontWeight: 700,
          textAlign: 'center',
          verticalAlign: 'middle',
        }}>
        {showProgress ? (
          <CircularProgress size={24} sx={{ color: 'white', marginTop: '10px' }} />
        ) : (
          <Box
            onClick={value ? onClick : () => {}}
            sx={{
              marginTop: '14px',
              display: 'flex',
              opacity: value ? 1 : 0.5,
              cursor: 'pointer',
            }}>
            <Box sx={{ marginRight: '8px', marginTop: '1px', marginLeft: 'auto' }}>
              <SaveIcon />
            </Box>
            <Box sx={{ marginRight: 'auto' }}>{intl.formatMessage({ id: btnText })}</Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
export default injectIntl(SaveInput);
