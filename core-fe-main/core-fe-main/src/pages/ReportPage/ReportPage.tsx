import { Box, Grid, Paper, Typography } from '@mui/material';
import React from 'react';
import { injectIntl } from 'react-intl';
import commonStyle from '../../styles/commonStyle';
import ChartImage1 from '../../assets/images/Chart-Group1.png';
import ChartImage2 from '../../assets/images/Chart-Group2.png';
import ChartImage3 from '../../assets/images/Chart-Group3.png';
import ChartImage4 from '../../assets/images/Chart-Group4.png';
import ChartImage5 from '../../assets/images/Chart-Group5.png';
import ChartImage6 from '../../assets/images/Chart-Group6.png';
import ChartImage7 from '../../assets/images/Chart-Group7.png';

interface IProps {
  intl: any;
}

const pageStyle = {
  inputContainer: {
    padding: '100px',
    borderRadius: '5px',
  },
  bottomContainer: {
    padding: '50px',
    borderRadius: '5px',
  },
  cardTitle: {
    fontFamily: 'Helvetica',
    fontWeight: '700',
    fontSize: '1.4rem',
    marginBottom: '20px',
    color: 'rgba(59, 63, 77, 1)',
  },
};

const ReportPage: React.FC<IProps> = ({ intl }) => {
  return (
    <Box sx={commonStyle.bodyContainer}>
      <Paper sx={pageStyle.inputContainer}>
        <img src={ChartImage1} alt="chart1" width="100%" />
      </Paper>
      <br />
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper sx={pageStyle.inputContainer}>
            <img src={ChartImage2} alt="chart2" width="100%" />
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={pageStyle.inputContainer}>
            <img src={ChartImage3} alt="chart3" width="100%" />
          </Paper>
        </Grid>
      </Grid>
      <br />
      <Paper sx={pageStyle.bottomContainer}>
        <Typography sx={pageStyle.cardTitle}>{intl.formatMessage({ id: 'analyze' })}</Typography>
        <Grid container spacing={5}>
          <Grid item xs={6}>
            <Box>
              <img src={ChartImage4} alt="chart2" width="100%" />
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <img src={ChartImage5} alt="chart3" width="100%" />
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <img src={ChartImage6} alt="chart2" width="100%" />
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <img src={ChartImage7} alt="chart3" width="100%" />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default injectIntl(ReportPage);
