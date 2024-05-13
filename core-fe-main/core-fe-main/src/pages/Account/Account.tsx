import { Box, Button, Grid, Paper } from '@mui/material';
import { Country, State } from 'country-state-city';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AccountClient from '../../api/Account/AccountAPI';
import {
  setAccounts,
  setDetailedMode,
  setDisabledMode,
  setEditData,
  setEditMode,
  setRefetchData,
} from '../../store/account/account.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import styles from '../../styles/styles';
import './Account.scss';
import ViewAccounts from './ViewAccounts';

interface IProps {
  intl?: any;
}

const Account: React.FC<IProps> = (): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ability = useSelector((state: any) => state.auth.ability);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const refetchData = useSelector((state: any) => state.account.refetchData);

  useEffect(() => {
    getAccounts();
    if (window.location.pathname === '/account') {
      dispatch(
        setSection({
          id: 10,
          name: 'account',
          route: '/account',
        }),
      );
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData && ability.can('GET', 'Account')) getAccounts();
    // eslint-disable-next-line
  }, [refetchData]);

  const getAccounts = () => {
    setIsDataLoading(true);
    AccountClient.getAccounts()
      .then((response: any) => {
        response.data.map((row: any) => {
          row.shipping_country = Country.getAllCountries().find(
            (country) => country.name === row.shipping_country,
          )?.isoCode;
          row.billing_country = Country.getAllCountries().find(
            (country) => country.name === row.billing_country,
          )?.isoCode;
          row.shipping_state = State.getStatesOfCountry(row.shipping_country).find(
            (state) => state.name === row.shipping_state,
          )?.isoCode;
          row.billing_state = State.getStatesOfCountry(row.billing_country).find(
            (state) => state.name === row.billing_state,
          )?.isoCode;
          return null;
        });
        dispatch(setRefetchData(false));
        dispatch(setAccounts(response.data));
        setIsDataLoading(false);
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
            sx={{
              textAlign: 'right',
            }}>
            {ability.can('POST', 'Account') ? (
              <Button
                sx={styles.dialogButton}
                onClick={() => {
                  dispatch(setEditMode(false));
                  dispatch(setEditData({}));
                  dispatch(setDisabledMode(false));
                  dispatch(setDetailedMode(false));
                  localStorage.removeItem('AccountInfo');
                  localStorage.setItem('AccountDetailedMode', 'false');
                  navigate('/account/add');
                }}>
                <FormattedMessage id="addAccount" />
              </Button>
            ) : null}
          </Box>
          <br />
          <ViewAccounts loader={isDataLoading} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default injectIntl(Account);
