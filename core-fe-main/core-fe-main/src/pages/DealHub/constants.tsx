import ClearIcon from '@mui/icons-material/Clear';
import DrawIcon from '@mui/icons-material/Draw';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, FormControl, InputLabel, MenuItem, Select, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { defaultDateFormat } from '../../constants/constants';

const getColumns = (
  intl: any,
  templates: any,
  openQuotePage: any,
  generateContractBasedOnTemplate: (id: string, quote: any) => void,
  handleDialog: any,
  openPreview: any,
  cancelSignatureRequest: any,
  isContractStatusInvalidForActions: (status: string | null) => boolean,
  isContractStatusValidForTemplateSelection: (status: string | null) => boolean,
  openActionPopUp: any,
  isRefreshButtonDisabled: any,
  isDetailedMode: boolean,
): GridColDef[] => {
  if (isDetailedMode) {
    return [
      {
        field: 'quote_name',
        headerAlign: 'left',
        align: 'left',
        headerName: intl.formatMessage({ id: 'quoteVersion' }),
        flex: 1,
        renderCell: (params: any) => {
          return (
            <strong>
              <Button
                style={{ marginLeft: 'auto', marginRight: 'auto', textTransform: 'none' }}
                tabIndex={params.hasFocus ? 0 : -1}
                onClick={() => openQuotePage(params.row.quote_id)}>
                {params.value}
              </Button>
            </strong>
          );
        },
      },
      {
        field: 'owner_name',
        headerAlign: 'left',
        align: 'left',
        headerName: intl.formatMessage({ id: 'ae' }),
        flex: 1,
      },
      {
        field: 'close_date',
        headerAlign: 'left',
        align: 'left',
        headerName: intl.formatMessage({ id: 'oppClosingDate' }),
        flex: 1,
        renderCell: (params: any) => {
          return dayjs(params.row.close_date)
            .format(localStorage.getItem('dateFormat') ?? defaultDateFormat)
            .toString();
        },
      },
      {
        field: 'template',
        headerAlign: 'left',
        headerClassName: 'dataGrid-Header',
        align: 'left',
        renderCell: (params: any) => {
          if (params.row.quote_status === 'approved') {
            if (
              isContractStatusValidForTemplateSelection(params.row.contract_details.contract_status)
            ) {
              return (
                <FormControl fullWidth>
                  <InputLabel id="select-label">Select Template</InputLabel>
                  <Select
                    label="Select Template"
                    labelId="select-label"
                    value={
                      ['Cancelled', undefined].includes(params.row.contract_details.contract_status)
                        ? // params.row.contract_details.contract_status === 'Cancelled'
                          ''
                        : params.row.template
                    }
                    onChange={(event) => {
                      params.row.template = event.target.value;
                      generateContractBasedOnTemplate(params.row.id, params.row);
                    }}>
                    {templates?.map((template: any) => (
                      <MenuItem value={template.id} key={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }
            return params.row.contract_details.contract_status === 'Activated' ? (
              <strong>
                <Button
                  style={{ marginLeft: 'auto', marginRight: 'auto', textTransform: 'none' }}
                  tabIndex={params.hasFocus ? 0 : -1}
                  onClick={() => openActionPopUp(params.row.contract_details.contract_id)}>
                  {params.row.contract_details.contract_number}
                </Button>
              </strong>
            ) : (
              params.row.contract_details.contract_number
            );
          }
          return null;
        },
        headerName: intl.formatMessage({ id: 'latestContract' }),
        flex: 1,
      },
    ];
  }
  return [
    {
      field: 'name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'oppName' }),
      flex: 1,
    },
    {
      field: 'owner_name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'ae' }),
      flex: 1,
    },
    {
      field: 'close_date',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'oppClosingDate' }),
      flex: 1,
      renderCell: (params: any) => {
        return dayjs(params.row.close_date)
          .format(localStorage.getItem('dateFormat') ?? defaultDateFormat)
          .toString();
      },
    },
    {
      field: 'quote_name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'latestQuote' }),
      flex: 1,
      renderCell: (params: any) => {
        return (
          <strong>
            <Button
              style={{ marginLeft: 'auto', marginRight: 'auto', textTransform: 'none' }}
              tabIndex={params.hasFocus ? 0 : -1}
              onClick={() => openQuotePage(params.row.quote_id)}>
              {params.value}
            </Button>
          </strong>
        );
      },
    },
    {
      field: 'quote_status',
      headerAlign: 'left',
      headerClassName: 'dataGrid-Header',
      align: 'left',
      headerName: intl.formatMessage({ id: 'quoteStatus' }),
      flex: 1,
    },
    {
      field: 'num_comments',
      headerAlign: 'left',
      headerClassName: 'dataGrid-Header',
      align: 'left',
      headerName: intl.formatMessage({ id: 'unreadCommentsQuote' }),
      flex: 1,
    },
    {
      field: 'contract_status',
      headerAlign: 'left',
      headerClassName: 'dataGrid-Header',
      align: 'left',
      headerName: intl.formatMessage({ id: 'contractStatus' }),
      flex: 1,
    },
    {
      field: 'template',
      headerAlign: 'left',
      headerClassName: 'dataGrid-Header',
      align: 'left',
      renderCell: (params: any) => {
        if (params.row.quote_status === 'approved') {
          if (
            isContractStatusValidForTemplateSelection(params.row.contract_details.contract_status)
          ) {
            return (
              <FormControl fullWidth>
                <InputLabel id="select-label">Select Template</InputLabel>
                <Select
                  label="Select Template"
                  labelId="select-label"
                  value={
                    ['Cancelled', undefined].includes(params.row.contract_details.contract_status)
                      ? // params.row.contract_details.contract_status === 'Cancelled'
                        ''
                      : params.row.template
                  }
                  onChange={(event) => {
                    params.row.template = event.target.value;
                    generateContractBasedOnTemplate(params.row.id, params.row);
                  }}>
                  {templates?.map((template: any) => (
                    <MenuItem value={template.id} key={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          return params.row.contract_details.contract_status === 'Activated' ? (
            <strong>
              <Button
                style={{ marginLeft: 'auto', marginRight: 'auto', textTransform: 'none' }}
                tabIndex={params.hasFocus ? 0 : -1}
                onClick={() => openActionPopUp(params.row.contract_details.contract_id)}>
                {params.row.contract_details.contract_number}
              </Button>
            </strong>
          ) : (
            params.row.contract_details.contract_number
          );
        }
        return null;
      },
      headerName: intl.formatMessage({ id: 'contract' }),
      flex: 1,
    },
    {
      field: 'actions',
      headerName: '',
      align: 'center',
      flex: 1,
      renderCell: (params: any) => {
        if (params.row.quote_status === 'approved' && params.row.template !== null) {
          return [
            <GridActionsCellItem
              icon={
                <Tooltip title="Refresh Contract" placement="top">
                  <RefreshIcon />
                </Tooltip>
              }
              disabled={isRefreshButtonDisabled(params.row.contract_details.contract_status)}
              label="Refresh Contract"
              onClick={() => generateContractBasedOnTemplate(params.row.id, params.row)}
            />,
            <GridActionsCellItem
              icon={
                <Tooltip title="Preview Contract" placement="top">
                  <PictureAsPdfIcon />
                </Tooltip>
              }
              disabled={isContractStatusInvalidForActions(
                params.row.contract_details.contract_status,
              )}
              label="Preview"
              onClick={() => openPreview(params.row.contract_details.contract_id)}
            />,
            <GridActionsCellItem
              key={params.row.id}
              icon={
                <Tooltip title="Sign Contract" placement="top">
                  <DrawIcon />
                </Tooltip>
              }
              disabled={isContractStatusInvalidForActions(
                params.row.contract_details.contract_status,
              )}
              label="Sign"
              onClick={() => handleDialog(params.row)}
            />,
            <GridActionsCellItem
              icon={
                <Tooltip title="Cancel Contract" placement="top">
                  <ClearIcon />
                </Tooltip>
              }
              disabled={isContractStatusInvalidForActions(
                params.row.contract_details.contract_status,
              )}
              label="Sign"
              onClick={() => cancelSignatureRequest(params.row.contract_details.contract_id)}
            />,
          ];
        }
        return null;
      },
    },
  ];
};

export default getColumns;
