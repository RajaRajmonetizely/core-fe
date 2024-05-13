import EditIcon from '@mui/icons-material/Edit';
import { Box, Button } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Snackbar from '../../components/Snackbar/Snackbar';
import { defaultDateFormat } from '../../constants/constants';
import { ISnackBar } from '../../models/common';
import {
  setDetailedMode,
  setDisabledMode,
  setEditData,
  setEditMode,
} from '../../store/account/account.slice';
import commonStyle from '../../styles/commonStyle';
import QuickSearchToolbar from '../../components/QuickSearchToolbar/QuickSearchToolbar';
import { escapeRegExp } from '../../utils/helperService';

const ViewAccounts: React.FC<any> = ({ intl, loader }): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ability = useSelector((state: any) => state.auth.ability);
  const accounts = useSelector((state: any) => state.account.accounts);

  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [searchText, setSearchText] = useState('');
  const [rows, setRows] = useState<any[]>(accounts);

  const requestSearch = (searchValue: string) => {
    setSearchText(searchValue);

    const searchRegex = new RegExp(escapeRegExp(searchValue), 'i');

    const filteredRows = accounts.filter((row: any) => {
      return Object.keys(row).some((field: any) => {
        return row[field] ? searchRegex.test(row[field].toString()) : false;
      });
    });

    setRows(filteredRows);
  };

  useEffect(() => setRows(accounts), [accounts]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'account_name' }),
      flex: 1,
      renderCell: (params: any) => {
        return (
          <strong>
            <Button
              style={{ marginLeft: 'auto', marginRight: 'auto', textTransform: 'none' }}
              tabIndex={params.hasFocus ? 0 : -1}
              onClick={() => openDetailsPage(params)}>
              {params.value}
            </Button>
          </strong>
        );
      },
    },
    {
      field: 'ownership',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'ownership' }),
      flex: 1,
    },
    {
      field: 'owner_name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'owner' }),
      flex: 1,
    },
    {
      field: 'industry_type_name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'industryType' }),
      flex: 1,
    },
    {
      field: 'created_on',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'createdOn' }),
      flex: 1,
      renderCell: (params: any) => {
        return dayjs(params.row.created_on)
          .format(localStorage.getItem('dateFormat') ?? defaultDateFormat)
          .toString();
      },
    },
    {
      field: 'actions',
      headerName: '',
      align: 'center',
      flex: 1,
      renderCell: (params: any) => {
        return [
          <GridActionsCellItem
            key={params.row.id}
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEditAccount(params)}
          />,
        ];
      },
    },
  ];

  const onEditAccount = (data: any) => {
    if (ability.can('PUT', 'Account')) {
      dispatch(setEditData(data.row));
      dispatch(setEditMode(true));
      dispatch(setDisabledMode(false));
      dispatch(setDetailedMode(false));
      localStorage.setItem('AccountInfo', JSON.stringify(data.row));
      localStorage.setItem('AccountDetailedMode', 'false');
      navigate(`/account/edit/${data.row.id}`);
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const openDetailsPage = (data: any) => {
    if (ability.can('PUT', 'Account')) {
      dispatch(setEditData(data.row));
      dispatch(setEditMode(true));
      dispatch(setDisabledMode(true));
      dispatch(setDetailedMode(true));
      localStorage.setItem('AccountInfo', JSON.stringify(data.row));
      localStorage.setItem('AccountDetailedMode', 'true');
      navigate(`/account/edit/${data.row.id}`);
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
      <Box sx={{ height: '520px', width: '100%' }}>
        <DataGrid
          components={{ Toolbar: QuickSearchToolbar }}
          rows={loader ? [] : rows}
          columns={columns}
          density="standard"
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 20,
              },
            },
          }}
          loading={loader}
          sx={commonStyle.dateGridStyle}
          componentsProps={{
            toolbar: {
              value: searchText,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                requestSearch(event.target.value),
              clearSearch: () => requestSearch(''),
            },
          }}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          disableColumnMenu
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
export default injectIntl(ViewAccounts);
