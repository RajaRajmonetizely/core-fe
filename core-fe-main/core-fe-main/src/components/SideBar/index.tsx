import {
  Avatar,
  Box,
  Divider,
  Grid,
  Icon,
  IconButton,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { ReactComponent as MenuIcon } from '../../assets/icons/menu.svg';
import Header from '../../pages/Header/Header';
import { UseAppDispatch } from '../../store';
import { setOpList } from '../../store/auth/auth.slice';
import { setCurrentPackage, setCurrentPackageList } from '../../store/package/package.slice';
import {
  setCurrentPlan,
  setCurrentSelectedProduct,
  setCurrentTierList,
} from '../../store/plans/plans.slice';
import { setSelectedPricingModel } from '../../store/pricing_model/pricingModel.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import SidePanel from '../SidePanel/SidePanel';
import SidePanelHeader from '../SidePanelHeader/SidePanelHeader';
import { dummyOperations, operationList, subOperationsList } from './constants';
import './style.scss';
import Logo from '../../assets/images/logo.png';

const Home: React.FC<any> = ({ intl }) => {
  const section = useSelector((state: any) => state.userSection.section);
  const userOperations = useSelector((state: any) => state.auth.userOperations);
  const dispatch = UseAppDispatch();
  const [open, setOpen] = useState(true);
  const [operations, setOperationsData] = useState<any>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inSalesForce = searchParams.get('inSalesForce') === 'true';

  useEffect(() => {
    const activeSection = localStorage.getItem('ActiveSection');
    if (activeSection) dispatch(setSection(JSON.parse(activeSection)));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setOpen(!inSalesForce);
  }, [inSalesForce]);

  useEffect(() => {
    let opList: any = [];
    _.keys(userOperations).forEach((p: any) => {
      const op = operationList.find((o: any) => o.operationName === p);
      if (op) opList.push(op);
      else if (_.keys(subOperationsList).includes(p)) {
        subOperationsList[p].forEach((operation: any) => opList.push(operation));
      }
    });
    opList = _.orderBy(opList, ['operationId'], ['asc']);
    opList.push(...dummyOperations);
    dispatch(setOpList(opList));
    if (opList.length && window.location.pathname === '/') {
      dispatch(
        setSection({
          id: opList[0].operationId,
          operationName: opList[0].operationName,
          name: opList[0].name,
          route: opList[0].path,
        }),
      );
      navigate(opList[0].path);
    }
    if (opList.length && localStorage.getItem('ActiveSection') === null) {
      dispatch(
        setSection({
          id: opList[0].operationId,
          operationName: opList[0].operationName,
          name: opList[0].name,
          route: opList[0].path,
        }),
      );
      navigate(opList[0].path);
    }
    setOperationsData(opList);
    // eslint-disable-next-line
  }, [userOperations]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(!open);
  };

  const getLeftMargin = () => {
    if (open) {
      return `289px`;
    }
    if (inSalesForce) {
      return `10px`;
    }
    return `95px`;
  };

  const onFeatureSelect = (item: any) => {
    dispatch(
      setSection({
        id: item.operationId,
        operationName: item.operationName,
        name: item.name,
        route: item.path,
      }),
    );
    navigate(item.path);
    if (item.name === 'plans') {
      dispatch(setCurrentPlan({}));
      dispatch(setCurrentSelectedProduct({}));
      dispatch(setCurrentTierList([]));
      dispatch(setCurrentPackage({}));
      dispatch(setCurrentPackageList([]));
      dispatch(setSelectedPricingModel({}));
    }
  };

  const getFeatureList = () => {
    return (
      <Grid style={{ width: 250, marginTop: '18px' }}>
        {operations.map((item: any, index: number) => (
          <ListItemButton
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            sx={{
              backgroundColor: section.id === item.operationId ? 'white' : '#f5f5f5',
            }}
            className="panelButton"
            onClick={() => onFeatureSelect(item)}>
            <Tooltip title={intl.formatMessage({ id: item.name })}>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    marginLeft: '-7px',
                    backgroundColor: section.id === item.operationId ? '#5D5FEF' : 'white',
                  }}>
                  <Icon className={section.id === item.operationId ? 'selectedIcon' : 'icon'}>
                    {item.icon}
                  </Icon>
                </Avatar>
              </ListItemAvatar>
            </Tooltip>
            <ListItemText>
              <Typography
                className={section.id === item.operationId ? 'panelTextSelected' : 'panelText'}>
                <FormattedMessage id={item.name} />
              </Typography>
            </ListItemText>
          </ListItemButton>
        ))}
      </Grid>
    );
  };

  return (
    <>
      {!inSalesForce && (
        <>
          <Header open={open} handleDrawerOpen={handleDrawerOpen} inSalesForce={inSalesForce} />

          <SidePanel
            variant="permanent"
            open={open}
            anchor="left"
            onClose={() => setOpen(false)}
            sx={{ backgroundColor: '#F5F5F5' }}>
            <SidePanelHeader>
              {open ? (
                <img src={Logo} alt="chart1" width="100%" style={{ maxWidth: '165px' }} />
              ) : (
                <Typography
                  variant="h5"
                  display="inline"
                  color="secondary"
                  sx={{
                    flexGrow: 1,
                    fontFamily: 'Helvetica',
                    marginLeft: '12px',
                    fontWeight: 700,
                  }}
                />
              )}
              <IconButton onClick={handleDrawerClose} sx={{ marginRight: !open ? '15px' : '0px' }}>
                <MenuIcon className="icon" />
              </IconButton>
            </SidePanelHeader>
            <Divider sx={{ marginLeft: '10px', marginRight: '10px' }} />
            {_.keys(userOperations).length ? getFeatureList() : null}
          </SidePanel>
        </>
      )}
      <Box
        sx={{
          marginLeft: getLeftMargin(),
          marginTop: '82px',
        }}>
        <Outlet />
      </Box>
    </>
  );
};

export default injectIntl(Home);
