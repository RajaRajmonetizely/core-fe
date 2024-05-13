import { Box, Typography } from '@mui/material';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import './CardHeaderText.scss';

export interface CardHeaderTextTypes {
  cardHeader: string;
}

const CardHeaderText: React.FC<CardHeaderTextTypes> = ({ cardHeader }) => {
  return (
    <Box sx={{ height: '58px', backgroundColor: '#EBECF0' }}>
      <Typography className="cardHeaderText">
        <FormattedMessage id={cardHeader} />
      </Typography>
    </Box>
  );
};

export default CardHeaderText;
