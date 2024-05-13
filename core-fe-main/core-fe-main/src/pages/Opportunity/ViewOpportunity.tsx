import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import {
  setDetailedMode,
  setDisabledMode,
  setEditData,
  setEditMode,
} from '../../store/opportunity/opportunity.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import commonStyle from '../../styles/commonStyle';
import getColumns from './OpportunityConstants';
import QuickSearchToolbar from '../../components/QuickSearchToolbar/QuickSearchToolbar';
import { escapeRegExp } from '../../utils/helperService';

const ViewOpportunities: React.FC<any> = ({ intl, loader }): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ability = useSelector((state: any) => state.auth.ability);
  const opportunities = useSelector((state: any) => state.opportunity.opportunities);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [searchText, setSearchText] = useState('');
  const [rows, setRows] = useState<any[]>(opportunities);

  const requestSearch = (searchValue: string) => {
    setSearchText(searchValue);
    const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

    const filteredRows = opportunities.filter((row: any) => {
      return Object.keys(row).some((field: any) => {
        return row[field] ? searchRegex.test(row[field].toString()) : false;
      });
    });

    setRows(filteredRows);
  };

  useEffect(() => setRows(opportunities), [opportunities]);

  const onEditOpportunity = (data: any) => {
    if (ability.can('PUT', 'Opportunity')) {
      const ac = opportunities.find((opportunity: any) => opportunity.id === data.id);
      dispatch(setEditData(ac));
      dispatch(setEditMode(true));
      dispatch(setDisabledMode(false));
      dispatch(setDetailedMode(false));
      localStorage.setItem('OpportunityInfo', JSON.stringify(data.row));
      localStorage.setItem('OpportunityDetailedMode', 'false');
      navigate(`/opportunity/edit/${data.row.id}`);
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const openDetailsPage = (data: any) => {
    if (ability.can('PUT', 'Opportunity')) {
      const ac = opportunities.find((opportunity: any) => opportunity.id === data.id);
      dispatch(setEditData(ac));
      dispatch(setEditMode(true));
      dispatch(setDisabledMode(true));
      dispatch(setDetailedMode(true));
      localStorage.setItem('OpportunityInfo', JSON.stringify(data.row));
      localStorage.setItem('OpportunityDetailedMode', 'true');
      dispatch(
        setSection({
          id: 15,
          name: 'opportunity',
          route: '/opportunity',
        }),
      );
      navigate(`/opportunity/edit/${data.row.id}`);
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  return (
    <>
      <br />
      <Box sx={{ width: '100%' }}>
        {window.location.pathname === '/opportunity' ? (
          <DataGrid
            components={{ Toolbar: QuickSearchToolbar }}
            rows={loader ? [] : rows}
            columns={getColumns(onEditOpportunity, openDetailsPage)}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 20,
                },
              },
            }}
            loading={loader}
            sx={commonStyle.dateGridStyle}
            pageSizeOptions={[20]}
            disableRowSelectionOnClick
            disableColumnMenu
            componentsProps={{
              toolbar: {
                value: searchText,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  requestSearch(event.target.value),
                clearSearch: () => requestSearch(''),
              },
            }}
          />
        ) : (
          <DataGrid
            rows={loader ? [] : opportunities}
            columns={getColumns(onEditOpportunity, openDetailsPage)}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 20,
                },
              },
              columns: {
                columnVisibilityModel: {
                  actions: false,
                },
              },
            }}
            loading={loader}
            sx={commonStyle.dateGridStyle}
            pageSizeOptions={[20]}
            disableRowSelectionOnClick
            disableColumnMenu
            density="standard"
          />
        )}
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
export default injectIntl(ViewOpportunities);
