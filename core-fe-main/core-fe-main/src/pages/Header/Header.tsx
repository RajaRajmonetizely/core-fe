import {
  Box,
  Toolbar,
  IconButton,
  // Button,
  Grid,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Auth } from 'aws-amplify';
import { ReactComponent as MenuIcon } from '../../assets/icons/menu.svg';
import './Header.scss';
import { logout } from '../../store/auth/auth.slice';
import AppHeader from '../../components/AppHeader/AppHeader';
import { clearUserAttributes } from '../../utils/auth';
import { clearStorage } from '../../utils/helperService';

const Header: React.FC<any> = ({ children, open, intl, handleDrawerOpen }) => {
  const profileData = useSelector((state: any) => state.users.profileData);
  const section = useSelector((state: any) => state.userSection.section);
  const [mimicUserData, setMimicUserData] = useState<any>({});
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const tempUser = localStorage.getItem('mimicUser');
    if (tempUser) {
      const mimicData = JSON.parse(tempUser);
      setMimicUserData(mimicData);
    }
  }, []);

  const onLogout = () => {
    if (mimicUserData?.email) {
      localStorage.removeItem('mimicUser');
      localStorage.removeItem('ActiveSection');
      navigate('/');
      window.location.reload();
    } else {
      Auth.signOut().finally(() => {
        clearUserAttributes();
        dispatch(logout());
        clearStorage();
        navigate('/login');
      });
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const onProfile = () => {
    navigate('/profile-settings');
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppHeader position="fixed" sx={{ backgroundColor: 'white' }} open={open}>
          <Toolbar>
            <Grid container alignItems="left">
              <Grid item md={9} sm={9}>
                {!open && (
                  <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={handleDrawerOpen}
                    sx={{ mr: 2 }}>
                    <MenuIcon className="icon" />
                  </IconButton>
                )}
                <Typography
                  display="inline-block"
                  className="headerText"
                  sx={{ flexGrow: 1, marginLeft: open ? '0px' : '33px !important' }}>
                  {section.name ? <FormattedMessage id={section.name} /> : null}
                </Typography>
              </Grid>
              <Grid item md={3} sm={3}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'row',
                    float: 'right',
                    p: 1,
                    m: 1,
                  }}>
                  {/* <NotificationsNoneOutlinedIcon
                    sx={{
                      color: '#718096',
                      height: '20px',
                      width: '20px',
                      marginRight: '10px',
                      marginLeft: 'auto',
                    }}
                  /> */}
                  <Avatar sx={{ height: '20px', width: '20px', marginRight: '7px' }} />
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#718096',
                      marginRight: '3px',
                    }}>
                    {mimicUserData?.email
                      ? `${intl.formatMessage({ id: 'mimicUser' })}: ${mimicUserData.email}`
                      : profileData.name}
                  </Typography>
                  <KeyboardArrowDownOutlinedIcon
                    sx={{
                      color: '#718096',
                      height: '17px',
                      width: '17px',
                      ':hover': { cursor: 'pointer' },
                    }}
                    onClick={(e: any) => handleOpenMenu(e)}
                  />
                </Box>
                <Menu
                  id="basic-menu"
                  open={openMenu}
                  anchorEl={anchorEl}
                  onClose={handleCloseMenu}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}>
                  <MenuItem onClick={onProfile}>{intl.formatMessage({ id: 'profile' })}</MenuItem>
                  <MenuItem onClick={onLogout}>{intl.formatMessage({ id: 'logout' })}</MenuItem>
                </Menu>
              </Grid>
            </Grid>
          </Toolbar>
        </AppHeader>
      </Box>
      {children}
    </>
  );
};

export default injectIntl(Header);
