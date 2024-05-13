import { Button, CircularProgress, FormControl, Stack } from '@mui/material';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';

const componentStyle = {
  loader: {
    color: '#865DDA',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  btnStyle: {
    backgroundColor: '#865DDA',
    ':hover': { backgroundColor: '#865DDA' },
    '&:disabled': {
      color: 'white',
      opacity: 0.5,
    },
    height: '50px',
    marginTop: '8px',
    color: 'white',
    fontStyle: 'normal',
    fontWeight: 700,
    width: '240px !important',
  },
};

const VersionEdit: React.FC<any> = ({
  data,
  loader,
  selectedValue,
  setSelectedValue,
  buttonLabel,
  disabled,
  inputLabel,
  onButtonClick,
}): ReactElement => {
  return (
    <Stack direction="row" spacing={4} alignItems="center">
      <FormControl sx={{ m: 1, width: 240 }}>
        {loader ? (
          <CircularProgress size={24} sx={componentStyle.loader} />
        ) : (
          <SearchAddAutocomplete
            caption={inputLabel}
            data={data}
            selectedItem={selectedValue}
            setSelectedData={setSelectedValue}
            showSelectionValue
          />
        )}
      </FormControl>
      <Button
        fullWidth
        type="submit"
        disabled={!selectedValue?.name || disabled}
        sx={componentStyle.btnStyle}
        onClick={onButtonClick}>
        {buttonLabel ? <FormattedMessage id={buttonLabel} /> : null}
      </Button>
    </Stack>
  );
};

export default VersionEdit;
