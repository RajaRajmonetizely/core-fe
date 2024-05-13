import ClearIcon from '@mui/icons-material/Clear';
import {
  Box,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import { useDispatch, useSelector } from 'react-redux';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import { setDealHubFilters } from '../../store/deal_hub/dealHub.slice';

const componentStyle = {
  sectionName: {
    color: '#3B3F4D',
    marginBottom: '8px',
    marginLeft: '6px',
    fontFamily: 'Helvetica',
    fontWeight: '700',
  },
  sectionBox: {
    display: 'inline-block',
    width: '300px',
    verticalAlign: 'top',
  },
  btnStyle: {
    background: '#5D5FEF',
    ':hover': { backgroundColor: '#5D5FEF' },
    '&:disabled': {
      color: 'white',
      opacity: 0.5,
    },
    color: 'white',
    fontFamily: 'Helvetica',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '10px 20px',
  },
  btnContainer: {
    marginLeft: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  paperContainer: {
    minHeight: '120px',
    display: 'flex',
    padding: '18px 33px',
  },
  syncIconStyle: {
    marginRight: '8px',
  },
};

interface IProps {
  intl: any;
  users: any;
  priceBooks: any;
  hierarchyList: any;
  loading: any;
}
// eslint-disable-next-line
const FilterSection: React.FC<IProps> = ({
  intl,
  users,
  priceBooks,
  hierarchyList,
  loading,
}): ReactElement => {
  const dispatch = useDispatch();
  const dealHubFilters = useSelector((state: any) => state.dealHub.dealHubFilters);
  const [closeDate, setCloseDate] = useState<any>([]);
  const [ae, setAe] = useState<any>();
  const [priceBook, setPriceBook] = useState<any>();
  const [assignedTo, setAssignedTo] = useState<any>();

  useEffect(() => {
    const data = {
      close_start_date:
        closeDate.length >= 1 ? new DateObject(closeDate[0]).format('YYYY-MM-DD') : undefined,
      close_end_date:
        // eslint-disable-next-line no-nested-ternary
        closeDate.length === 1
          ? new DateObject(closeDate[0]).format('YYYY-MM-DD')
          : closeDate.length === 2
          ? new DateObject(closeDate[1]).format('YYYY-MM-DD')
          : undefined,
      opportunity_owner: ae?.id,
      pricebook: priceBook?.id,
      assigned_to: assignedTo?.id,
    };
    dispatch(setDealHubFilters({ ...dealHubFilters, ...data }));
    // eslint-disable-next-line
  }, [closeDate, ae, priceBook, assignedTo]);

  const dropdownComponent = (
    id: string,
    caption: string,
    options: any,
    selectedItem: any,
    setSelectedData: any,
    isDate: boolean = false,
  ) => {
    return (
      <Box sx={componentStyle.sectionBox}>
        <Typography sx={componentStyle.sectionName}>
          <FormattedMessage id={id} />
        </Typography>
        <FormControl sx={{ m: 1, minWidth: 245 }}>
          {isDate ? (
            <DatePicker
              style={{
                backgroundColor: 'transparent',
                width: '245px',
                height: '50px',
                fontSize: '16px',
              }}
              format="MM/DD/YYYY"
              render={(value, openCalendar) => {
                return (
                  <TextField
                    onClick={openCalendar}
                    value={value}
                    label={intl.formatMessage({ id: 'oppClosingDate' })}
                    placeholder={intl.formatMessage({ id: 'oppClosingDate' })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={(e) => {
                              setCloseDate([]);
                              e.stopPropagation();
                            }}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                );
              }}
              value={selectedItem}
              onChange={setSelectedData}
              range
            />
          ) : (
            <SearchAddAutocomplete
              caption={caption}
              data={options}
              selectedItem={selectedItem}
              setSelectedData={setSelectedData}
              showSelectionValue
              loading={loading}
              showAddOption={false}
            />
          )}
        </FormControl>
      </Box>
    );
  };

  return (
    <Grid container sx={{ background: 'rgba(244, 246, 254, 1)', padding: '26px 40px' }}>
      <Grid item md={12}>
        {dropdownComponent('oppClosingDate', 'oppClosingDate', [], closeDate, setCloseDate, true)}
        {dropdownComponent('ae', 'ae', users, ae, setAe)}
        {dropdownComponent('pricebook', 'pricebook', priceBooks, priceBook, setPriceBook)}
        {dropdownComponent('assignTo', 'assignTo', hierarchyList, assignedTo, setAssignedTo)}
      </Grid>
    </Grid>
  );
};

export default injectIntl(FilterSection);
