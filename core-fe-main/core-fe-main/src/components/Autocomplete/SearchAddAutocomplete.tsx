import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Autocomplete, Checkbox, TextField, createFilterOptions } from '@mui/material';
import React, { useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { ISnackBar } from '../../models/common';
import { REGEX } from '../../utils/helperService';
import Snackbar from '../Snackbar/Snackbar';
import { AutocompleteTypes, OptionType } from './AutocompleteTypes';

const filter = createFilterOptions<OptionType>();
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const SearchAddAutocomplete: React.FC<AutocompleteTypes> = ({
  intl,
  caption,
  data,
  selectedItem = {},
  setSelectedData,
  readOnly = false,
  showSelectionValue = false,
  multiselect = false,
  showAddOption = true,
  loading = false,
}) => {
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  return (
    <>
      <Autocomplete
        loading={loading}
        readOnly={readOnly}
        value={selectedItem}
        multiple={multiselect}
        size="small"
        limitTags={2}
        autoHighlight
        disableCloseOnSelect={multiselect}
        onChange={(event, newValue) => {
          const reg = REGEX;
          if (newValue && !reg.test(newValue.inputValue)) {
            setSnackBarValues({
              display: true,
              type: 'error',
              message: intl.formatMessage({ id: 'valueWithSpecialCharacters' }),
            });
            return;
          }
          if (newValue && newValue.inputValue) {
            setSelectedData({
              name: newValue.inputValue,
              id: uuidv4(),
            });
          } else {
            setSelectedData(newValue);
          }
        }}
        filterOptions={(options, params): any => {
          let filtered = filter(options, params);
          if (params.inputValue && options) {
            filtered = options.filter((item) => {
              if (item && item.name) {
                return item.name?.toLowerCase().indexOf(params.inputValue.toLowerCase()) >= 0;
              }
              return false;
            });
          }
          if (
            showAddOption &&
            params.inputValue.trim() !== '' &&
            filtered.findIndex((v) => params.inputValue.toLowerCase() === v.name.toLowerCase()) ===
              -1
          ) {
            filtered.push({
              inputValue: params.inputValue,
              name: `Add "${params.inputValue}"`,
            });
          }

          return filtered;
        }}
        id="search-add-box"
        options={data}
        getOptionLabel={(option) => {
          if (showSelectionValue) {
            if (option && option.inputValue) {
              return option.inputValue;
            }
            return option?.name || '';
          }
          return '';
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        renderOption={(props, option) => {
          return (
            <li {...props} key={uuidv4()}>
              {multiselect && option.id ? (
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selectedItem.some((item: any) => item.id === option.id)}
                />
              ) : null}

              {option.name}
            </li>
          );
        }}
        freeSolo={showAddOption}
        renderInput={(params: any) => (
          <TextField selectable {...params} label={<FormattedMessage id={caption} />} />
        )}
      />
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

export default React.memo(injectIntl(SearchAddAutocomplete));
