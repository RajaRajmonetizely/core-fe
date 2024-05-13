import { Checkbox, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import pageStyle from './pageStyle';

const getColumns = (
  intl: any,
  salesforceFieldsList: any,
  monetizelyFieldsList: any,
  handleChange: any,
): GridColDef[] => {
  return [
    {
      field: 'salesforceField',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'salesforceFields' }),
      renderCell: (params: any) => {
        return (
          <FormControl sx={{ width: '80%' }}>
            <InputLabel id="salesforceField">
              {intl.formatMessage({ id: 'salesforceFields' })}
            </InputLabel>
            <Select
              id="salesforceField"
              value={params.value}
              label="Salesforce Field"
              onChange={(e) => {
                params.row.salesforceField = e.target.value;
                handleChange(params.row.id, params.row);
              }}>
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {params.value ? (
                <MenuItem value={params.value} key={params.value}>
                  {params.value}
                </MenuItem>
              ) : null}
              {salesforceFieldsList.map((sf: any) => {
                return (
                  <MenuItem value={sf} key={sf}>
                    {sf}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        );
      },
      flex: 1,
    },
    {
      field: 'monetizelyField',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'monetizelyFields' }),
      renderCell: (params: any) => {
        return (
          <FormControl sx={{ width: '80%' }}>
            <InputLabel id="monetizelyField">
              {intl.formatMessage({ id: 'monetizelyFields' })}
            </InputLabel>
            <Select
              id="monetizelyField"
              value={params.value}
              label="Monetizely Field"
              onChange={(e) => {
                params.row.monetizelyField = e.target.value;
                handleChange(params.row.id, params.row);
              }}>
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {params.value ? (
                <MenuItem value={params.value} key={params.value}>
                  {params.value}
                </MenuItem>
              ) : null}
              {monetizelyFieldsList.map((mf: any) => {
                return (
                  <MenuItem value={mf} key={mf}>
                    {mf}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        );
      },
      flex: 1,
    },
    {
      field: 'integrateFromSalesforce',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'integrateFromSalesforce' }),
      renderCell: (params: any) => {
        return (
          <Checkbox
            checked={params.value}
            onChange={() => {
              params.row.integrateFromSalesforce = !params.value;
              handleChange(params.row.id, params.row);
            }}
            sx={pageStyle.checkBox}
          />
        );
      },
      flex: 1,
    },
    {
      field: 'integrateToSalesforce',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'integrateToSalesforce' }),
      flex: 1,
      renderCell: (params: any) => {
        return (
          <Checkbox
            checked={params.value}
            onChange={() => {
              params.row.integrateToSalesforce = !params.value;
              handleChange(params.row.id, params.row);
            }}
            sx={pageStyle.checkBox}
          />
        );
      },
    },
  ];
};

export default getColumns;
