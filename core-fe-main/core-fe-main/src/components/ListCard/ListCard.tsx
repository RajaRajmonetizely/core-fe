import { Box } from '@mui/material';
import React from 'react';
import './ListCard.scss';

const ListCard: React.FC<any> = ({ children }) => {
  return <Box className="card">{children}</Box>;
};

export default ListCard;
