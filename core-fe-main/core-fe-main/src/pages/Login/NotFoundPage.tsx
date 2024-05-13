import { Button, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const onBackToHome = () => {
    navigate('/');
  };

  return (
    <Grid container component="main" direction="column" alignItems="center" justifyContent="center">
      <Typography sx={{ color: 'black', fontSize: 100 }}>404</Typography>
      <h3>Page Not Found</h3>

      <Button color="inherit" onClick={onBackToHome}>
        Back to Home
      </Button>
    </Grid>
  );
};

export default NotFoundPage;
