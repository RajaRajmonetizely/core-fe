import { Box, Button, Grid, Paper } from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import OpportunityClient from '../../api/Opportunity/OpportunityAPI';
import {
  setDetailedMode,
  setDisabledMode,
  setEditData,
  setEditMode,
  setOpportunities,
  setRefetchData,
} from '../../store/opportunity/opportunity.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import styles from '../../styles/styles';
import ViewOpportunities from './ViewOpportunity';

interface IProps {
  intl?: any;
}

const Opportunity: React.FC<IProps> = (): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ability = useSelector((state: any) => state.auth.ability);
  const editData = useSelector((state: any) => state.account.editAccountData);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const refetchData = useSelector((state: any) => state.opportunity.refetchData);

  useEffect(() => {
    getOpportunities();
    if (window.location.pathname === '/opportunity') {
      dispatch(
        setSection({
          id: 15,
          name: 'opportunity',
          route: '/opportunity',
        }),
      );
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData) getOpportunities();
    // eslint-disable-next-line
  }, [refetchData]);

  const getOpportunities = () => {
    if (ability.can('GET', 'Opportunity')) {
      setIsDataLoading(true);
      OpportunityClient.getOpportunity()
        .then((response: any) => {
          if (Object.keys(editData).length !== 0 && window.location.pathname !== '/opportunity') {
            dispatch(
              setOpportunities(
                response.data.filter((opportunity: any) => opportunity.account_id === editData.id),
              ),
            );
          } else {
            dispatch(setOpportunities(response.data));
          }
          dispatch(setRefetchData(false));
          setIsDataLoading(false);
        })
        .catch((e) => {
          setIsDataLoading(false);
          console.error(e);
        });
    }
  };

  return (
    <Grid container>
      <Grid item md={12}>
        <Paper
          sx={
            window.location.pathname === '/opportunity'
              ? {
                  padding: '18px 33px',
                  marginRight: '20px',
                }
              : null
          }>
          {window.location.pathname === '/opportunity' ? (
            <Box
              sx={{
                textAlign: 'right',
              }}>
              {ability.can('POST', 'Opportunity') ? (
                <Button
                  sx={styles.dialogButton}
                  onClick={() => {
                    dispatch(setEditMode(false));
                    dispatch(setEditData({}));
                    dispatch(setDetailedMode(false));
                    dispatch(setDisabledMode(false));
                    localStorage.removeItem('OpportunityInfo');
                    localStorage.setItem('OpportunityDetailedMode', 'false');
                    navigate('/opportunity/add');
                  }}>
                  <FormattedMessage id="addOpportunity" />
                </Button>
              ) : null}
            </Box>
          ) : null}
          <br />
          <ViewOpportunities loader={isDataLoading} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default injectIntl(Opportunity);
