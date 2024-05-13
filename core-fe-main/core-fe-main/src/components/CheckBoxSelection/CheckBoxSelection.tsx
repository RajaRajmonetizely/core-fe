import { Box } from '@mui/material';
import React, { ReactElement } from 'react';
import { injectIntl } from 'react-intl';

const componentStyle = {
  title: {
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '1rem',
    lineHeight: '18px',
    color: '#3B3F4D',
    marginBottom: '16px',
  },
  container: {
    maxHeight: '250px',
    overflow: 'scroll',
  },
  checkboxContainer: {
    display: 'flex',
    marginBottom: '15px',
  },
  box: (item: any) => {
    return {
      width: '16px',
      height: '16px',
      border: '1px solid #C4C4C4',
      borderRadius: '3px',
      cursor: 'pointer',
      marginRight: '12px',
      backgroundColor: item.checked ? '#718096' : 'white',
    };
  },
  label: {
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '16px',
    color: '#576079',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
};

interface IProps {
  title: string;
  customTitle: boolean;
  intl: any;
  fieldKey: string;
  idField: string;
  lists: any;
  onChange: (index: number, item: any) => void;
}

const CheckBoxSelection: React.FC<IProps> = ({
  title,
  customTitle,
  intl,
  lists,
  fieldKey,
  idField,
  onChange,
}): ReactElement => {
  return (
    <Box>
      <Box sx={componentStyle.title}>{customTitle ? title : intl.formatMessage({ id: title })}</Box>
      <Box sx={componentStyle.container}>
        {lists.map((item: any, i: number) => {
          return (
            <Box
              onClick={() => onChange(i, item)}
              key={item[idField]}
              sx={componentStyle.checkboxContainer}>
              <Box sx={componentStyle.box(item)} />
              <Box sx={componentStyle.label}>{item[fieldKey]}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
export default injectIntl(CheckBoxSelection);
