import { AppBar, AppBarProps, styled } from '@mui/material';

interface AppBarPropsStyled extends AppBarProps {
  open?: boolean;
}

const drawerWidth = 280;

const AppHeader = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarPropsStyled>(({ theme, open }) => ({
  // zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default AppHeader;
