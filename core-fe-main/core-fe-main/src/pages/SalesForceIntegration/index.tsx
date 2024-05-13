import React, { useEffect, useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import commonStyle from '../../styles/commonStyle';
import { salesForceTabs } from '../../constants/constants';
import styles from '../../styles/styles';
import Home from './Home';
import Opportunity from './Opportunity';
import Contract from './Contract';
import Quote from './Quote';
import User from './User';
import Account from './Account';
import SalesForceClient from '../../api/SalesForce/SalesForceAPIs';
import {
  setRefetchData,
  setSalesForceSettings,
  setSalesforceMapping,
} from '../../store/salesforce/salesforce.slice';
import SalesHierarchy from './SalesHierarchy';

interface IProps {
  intl: any;
}

const pageStyle = {
  tabsContainer: {
    marginBottom: '20px',
    marginTop: '8px',
  },
};

const SalesForceIntegration: React.FC<IProps> = ({ intl }) => {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = React.useState(0);
  const ability = useSelector((state: any) => state.auth.ability);
  const refetchData = useSelector((state: any) => state.salesForce.refetchData);
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    getObjectMappingData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData) getObjectMappingData();
    // eslint-disable-next-line
  }, [refetchData]);

  useEffect(() => {
    if (ability && ability.can('GET', 'Sync to Salesforce')) {
      getSettingsData();
    }
    // eslint-disable-next-line
  }, [ability]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const getSettingsData = async () => {
    try {
      setLoadingSettings(true);
      const response = await SalesForceClient.getSalesforceSettings();
      if (response.message === 'success') {
        dispatch(setSalesForceSettings(response.data));
      }
      setLoadingSettings(false);
    } catch {
      setLoadingSettings(false);
    }
  };

  const getObjectMappingData = async () => {
    try {
      const response = await SalesForceClient.getSalesforceMapping();
      if (response.message === 'success') {
        dispatch(setSalesforceMapping(response.data));
      }
      dispatch(setRefetchData(false));
    } catch {
      dispatch(setRefetchData(false));
    }
  };

  return (
    <Box sx={commonStyle.bodyContainer}>
      <Tabs
        value={selectedTab}
        onChange={handleChange}
        textColor="secondary"
        sx={pageStyle.tabsContainer}
        indicatorColor="secondary">
        {salesForceTabs.map((t) => {
          return (
            <Tab
              key={t.id}
              label={intl.formatMessage({ id: t.name })}
              sx={{ borderBottom: '2px solid  #C3C3CF', flex: 1, ...styles.tabLabelStyle }}
            />
          );
        })}
      </Tabs>
      {(() => {
        switch (selectedTab) {
          case 0:
            return <Home loader={loadingSettings} />;
          case 1:
            return <Account />;
          case 2:
            return <Opportunity />;
          case 3:
            return <Contract />;
          case 4:
            return <Quote />;
          case 5:
            return <User />;
          case 6:
            return <SalesHierarchy />;
          default:
            return null;
        }
      })()}
    </Box>
  );
};

export default injectIntl(SalesForceIntegration);
