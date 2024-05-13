import DeleteIcon from '@mui/icons-material/Delete';
import { Box, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import styles from '../../styles/styles';

interface IProps {
  type?: string;
  sx?: any;
  isDelete?: boolean;
  intl: any;
  value?: any;
  item?: any;
  readOnly?: boolean;
  onTextChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete?: () => void;
}

const PricingTableCell: React.FC<IProps> = ({
  type,
  value,
  intl,
  readOnly,
  isDelete,
  item = {},
  sx = {},
  onTextChange,
  onDelete,
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Box
      sx={{
        fontWeight: 400,
        color: '#000000',
        background: 'white',
        padding: '8px 0px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        ...styles.tableCell,
        ...sx,
      }}>
      {type === 'view' || item.is_output_column || item.is_intermediate_column ? (
        // eslint-disable-next-line
        <>
          {isDelete && !readOnly ? (
            <DeleteIcon
              onClick={() => {
                if (onDelete) {
                  onDelete();
                }
              }}
              sx={{ marginTop: '17px', cursor: 'pointer' }}
            />
          ) : null}
        </>
      ) : (
        <TextField
          InputProps={{
            readOnly,
            inputProps: {
              style: { textAlign: 'center' },
              min: 0,
            },
          }}
          FormHelperTextProps={{
            style: { textAlign: 'center' },
          }}
          key={item.key ?? uuidv4()}
          value={inputValue}
          error={inputValue !== '' && Number(inputValue) < 0}
          helperText={
            inputValue !== '' && Number(inputValue) < 0 ? `Please enter positive values` : ''
          }
          onChange={onTextChange}
          type="number"
          placeholder={intl.formatMessage({ id: 'value' })}
          sx={{
            textAlign: 'center',
            '& fieldset': { border: 'none' },
          }}
        />
      )}
    </Box>
  );
};

export default injectIntl(PricingTableCell);
