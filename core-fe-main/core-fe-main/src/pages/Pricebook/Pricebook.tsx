import React, { ReactElement, useEffect, useState } from 'react';
import './Pricebook.scss';
import { injectIntl } from 'react-intl';
import { Box, Grid, Paper } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import PricebookClient from '../../api/PriceBook/PricebookAPI';
import { setPriceBooks, setRefetchData } from '../../store/price_book/pricebook.slice';
import ViewPricebooks from './ViewPricebooks';
import CreatePricebook from './CreatePricebook';
import commonStyle from '../../styles/commonStyle';

interface IProps {
  intl?: any;
}

const Pricebook: React.FC<IProps> = (): ReactElement => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const refetchData = useSelector((state: any) => state.priceBook.refetchData);
  useEffect(() => {
    getPriceBooks();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData) getPriceBooks();
    // eslint-disable-next-line
  }, [refetchData]);

  const getPriceBooks = () => {
    setIsDataLoading(true);
    PricebookClient.getPriceBooks()
      .then((response: any) => {
        dispatch(setRefetchData(false));
        dispatch(setPriceBooks(response.data));
        setIsDataLoading(false);
      })
      .catch((e) => {
        setIsDataLoading(false);
        console.error(e);
      });
  };

  return (
    <Grid sx={commonStyle.bodyContainer} container>
      <Grid item md={12}>
        <Paper
          sx={{
            padding: '18px 33px',
            marginRight: '20px',
          }}>
          <Box
            sx={{
              textAlign: 'right',
            }}>
            {ability.can('POST', 'Price Book') ? <CreatePricebook /> : null}
          </Box>
          <br />
          <ViewPricebooks dataLoading={isDataLoading} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default injectIntl(Pricebook);
