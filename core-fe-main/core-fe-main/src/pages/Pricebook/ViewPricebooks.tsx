import React, { ReactElement, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { injectIntl } from 'react-intl';
import {
  DataGridPremium,
  useGridApiRef,
  useKeepGroupedColumnsHidden,
} from '@mui/x-data-grid-premium';
import { Box } from '@mui/material';
import { deletePriceBook, setEditData, setEditMode } from '../../store/price_book/pricebook.slice';
import PriceBookClient from '../../api/PriceBook/PricebookAPI';
import getColumns from './PricebookConstants';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import commonStyle from '../../styles/commonStyle';

interface IPriceBook {
  intl: any;
  dataLoading?: boolean;
}

const ViewPriceBooks: React.FC<IPriceBook> = ({ intl, dataLoading }): ReactElement => {
  const dispatch = useDispatch();
  const apiRef = useGridApiRef();
  const ability = useSelector((state: any) => state.auth.ability);
  const priceBooks = useSelector((state: any) => state.priceBook.priceBooks);
  const [rows, setRows] = useState<any>([]);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  useEffect(() => {
    const rowValues: any = [];
    priceBooks.forEach((p: any) => {
      p.products.forEach((pr: any) => {
        return rowValues.push({ name: p.name, ...pr });
      });
    });
    setRows(rowValues);
  }, [priceBooks]);

  const onDeletePriceBook = async (data: any) => {
    if (ability.can('DELETE', 'Price Book')) {
      const value = rows.find((r: any) => r.id === data.rowNode.children[0]);
      const response = await PriceBookClient.deletePriceBook(value.price_book_id);
      try {
        if (response) {
          dispatch(deletePriceBook({ id: value.price_book_id }));
          setSnackBarValues({
            display: true,
            type: 'success',
            message: intl.formatMessage({ id: 'pricebookDeleteMessage' }),
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const onEditPriceBook = (data: any) => {
    if (ability.can('PUT', 'Price Book')) {
      const value = rows.find((r: any) => r.id === data.rowNode.children[0]);
      const pb = priceBooks.find((p: any) => p.id === value.price_book_id);
      dispatch(setEditData(pb));
      dispatch(setEditMode(true));
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const initialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState: {
      rowGrouping: {
        model: ['name'],
      },
    },
    rowGroupingModel: ['name'],
  });
  return (
    <>
      <br />
      <Box sx={{ height: '550px', width: '100%' }}>
        <DataGridPremium
          rows={dataLoading ? [] : rows}
          columns={getColumns(onEditPriceBook, onDeletePriceBook)}
          apiRef={apiRef}
          initialState={initialState}
          pageSizeOptions={[15]}
          disableRowSelectionOnClick
          loading={dataLoading}
          sx={commonStyle.dateGridStyle}
        />
      </Box>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </>
  );
};
export default injectIntl(ViewPriceBooks);
