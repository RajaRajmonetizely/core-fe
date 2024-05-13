import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import { injectIntl } from 'react-intl';
import { Box, Grid, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  deletePriceBook,
  setEditData,
  setEditMode,
  setPriceBookRules,
  setRefetchData,
} from '../../store/price_book_rules/pricebookRules.slice';
import CreatePricebookRule from './CreatePricebookRule';
import PriceBookRuleClient from '../../api/PriceBookRules/PricebookRulesAPI';
import commonStyle from '../../styles/commonStyle';
import getColumns from './PricebookRuleConstants';

interface IProps {
  intl?: any;
}

const PricebookRule: React.FC<IProps> = (): ReactElement => {
  const dispatch = useDispatch();
  const [isDataLoading, setIsDataLoading] = useState(false);
  const priceBookRules = useSelector((state: any) => state.priceBookRules.priceBookRules);
  const refetchData = useSelector((state: any) => state.priceBookRules.refetchData);

  useEffect(() => {
    getPriceBookRules();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData) getPriceBookRules();
    // eslint-disable-next-line
  }, [refetchData]);

  const getPriceBookRules = () => {
    setIsDataLoading(true);
    PriceBookRuleClient.getPriceBookRules()
      .then((response: any) => {
        dispatch(setRefetchData(false));
        dispatch(setPriceBookRules(response.data));
        setIsDataLoading(false);
      })
      .catch((e) => {
        setIsDataLoading(false);
        console.error(e);
      });
  };

  const onEditPriceBookRule = (data: any) => {
    dispatch(setEditData(data.row));
    dispatch(setEditMode(true));
  };

  const onDeletePriceBookRule = (data: any) => {
    setIsDataLoading(true);
    PriceBookRuleClient.deletePriceBookRule(data.row?.id)
      .then((response: any) => {
        if (response.message === 'success') {
          dispatch(deletePriceBook(data.row));
          setIsDataLoading(false);
        }
      })
      .catch((e) => {
        setIsDataLoading(false);
        console.error(e);
      });
  };

  return (
    <Grid container>
      <Grid item md={12}>
        <Paper
          sx={{
            padding: '18px 33px',
            marginRight: '20px',
          }}>
          <Box
            key={uuidv4()}
            sx={{
              textAlign: 'right',
            }}>
            <CreatePricebookRule />
          </Box>
          <br />
          <br />
          <Box key={uuidv4()} sx={{ width: '100%' }}>
            <DataGrid
              rows={isDataLoading ? [] : priceBookRules}
              columns={getColumns(onEditPriceBookRule, onDeletePriceBookRule)}
              getRowId={() => uuidv4()}
              density="comfortable"
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 20,
                  },
                },
                sorting: {
                  sortModel: [{ field: 'created_on', sort: 'desc' }],
                },
              }}
              key={uuidv4()}
              pageSizeOptions={[20]}
              disableRowSelectionOnClick
              sx={commonStyle.dateGridStyle}
              loading={isDataLoading}
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default injectIntl(PricebookRule);
