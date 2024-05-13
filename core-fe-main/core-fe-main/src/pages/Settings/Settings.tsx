import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { red, green, yellow } from '@mui/material/colors';
import React, { ReactElement } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import commonStyle from '../../styles/commonStyle';
import styles from '../../styles/styles';
import { PRICING_GUIDAANCE } from '../../constants/constants';

const redLight = red[200];
const yellowLight = yellow[200];
const greenLight = green[200];

interface IProps {
  //   intl: any;
}

const discounting = [
  {
    product: '',
    tier: '',
    addon: '',
    green: 5,
    yellow: 10,
    red: 15,
    pricebook: 'Startup',
  },
  {
    product: 'Slack',
    tier: 'Pro',
    addon: '',
    green: 5,
    yellow: 12,
    red: 20,
    pricebook: 'Startup',
  },
  {
    product: 'Slack',
    tier: 'Business+',
    addon: '',
    green: 5,
    yellow: 10,
    red: 15,
  },
  {
    product: 'Slack',
    tier: 'Business+',
    addon: 'Slack Atlas',
    green: 15,
    yellow: 22,
    red: 30,
  },
  {
    product: 'Slack',
    tier: 'Enterprise Grid',
    addon: '',
    green: 10,
    yellow: 20,
    red: 25,
  },
];

const dealTerms = [
  {
    product: '',
    tier: '',
    addon: '',
    term: 'Payment Term',
    green: 'Net15',
    yellow: 'Net30',
    red: 'Net45',
    pricebook: 'Startup',
  },

  {
    product: 'Slack',
    tier: 'Business+',
    addon: '',
    green: 'Net15',
    yellow: 'Net30',
    red: 'Net30',
    term: 'Payment Term',
  },

  {
    product: 'Slack',
    tier: 'Enterprise Grid',
    addon: '',
    green: 'Net15',
    yellow: 'Net15',
    red: 'Net30',
    term: 'Payment Term',
  },
  {
    product: 'Slack',
    tier: 'Business+',
    addon: '',
    green: 'Annual',
    yellow: 'Quarterly',
    red: 'Monthly',
    term: 'Billing Cycle',
  },

  {
    product: 'Slack',
    tier: 'Enterprise Grid',
    addon: '',
    green: 'Annual',
    yellow: 'Annual',
    red: 'Quarterly',
    term: 'Billing Cycle',
  },
];

const pageStyle = {
  formContainer: {
    padding: '50px 20px',
    borderRadius: '5px',
  },
  label: {
    alignSelf: 'center',
  },
  cardTitle: {
    fontFamily: 'Helvetica',
    fontWeight: '700',
    fontSize: '1.4rem',
    marginBottom: '20px',
    color: 'rgba(59, 63, 77, 1)',
  },
};
const Settings: React.FC<IProps> = (): ReactElement => {
  const [open, setOpen] = React.useState(false);
  const [useTerms, setUseTerms] = React.useState(false);

  const [product, setProduct] = React.useState('');

  const handleProductChange = (event: SelectChangeEvent) => {
    setProduct(event.target.value);
  };

  const handleClick = async () => {
    try {
      const tempLink = document.createElement('a');
      tempLink.href = PRICING_GUIDAANCE;
      tempLink.click();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleTermsClickOpen = () => {
    setOpen(true);
    setUseTerms(true);
  };

  const handleClose = () => {
    setOpen(false);
    setUseTerms(false);
  };

  return (
    <Box sx={commonStyle.bodyContainer}>
      <Paper sx={pageStyle.formContainer}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <span style={pageStyle.label}>
              <FormattedMessage id="allowRepToQueryOpportunities" />
            </span>
          </Grid>
          <Grid item xs={8}>
            <Switch defaultChecked />
          </Grid>

          <Grid item xs={4}>
            <span style={pageStyle.label}>Access Level for the Opportunity Data</span>
          </Grid>
          <Grid item xs={8}>
            <RadioGroup row defaultValue="full">
              <FormControlLabel value="full" control={<Radio />} label="All Opportunities" />
              <FormControlLabel
                value="anonymised"
                control={<Radio />}
                label="All Opportunities (anonymised)"
              />
              <FormControlLabel
                value="pricebook"
                control={<Radio />}
                label="All Pricebook Opportunities"
              />
              <FormControlLabel value="own" control={<Radio />} label="Own Opportunities" />
            </RadioGroup>
          </Grid>

          <Grid item xs={4}>
            <span style={pageStyle.label}>Access Level for the Opportunity Summary Data</span>
          </Grid>
          <Grid item xs={8}>
            <RadioGroup row defaultValue="full">
              <FormControlLabel value="full" control={<Radio />} label="All Opportunities" />

              <FormControlLabel
                value="pricebook"
                control={<Radio />}
                label="All Pricebook Opportunities"
              />
              <FormControlLabel value="own" control={<Radio />} label="Own Opportunities" />
            </RadioGroup>
          </Grid>

          <Grid item xs={4}>
            <span style={pageStyle.label}>Allow ad-hoq queries</span>
          </Grid>
          <Grid item xs={8}>
            <Switch defaultChecked />
          </Grid>
        </Grid>
      </Paper>
      <br />
      <Paper sx={pageStyle.formContainer}>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography variant="h5">Pricing Guidance</Typography>
          </Grid>
          <Grid item xs={1}>
            <Button sx={styles.dialogButton} onClick={handleClick}>
              Download
            </Button>
          </Grid>

          <Grid item xs={1}>
            <Button sx={styles.dialogButton}>Upload</Button>
          </Grid>
        </Grid>
      </Paper>
      <br />

      <Paper sx={pageStyle.formContainer}>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography variant="h5">Discounting Recommendations</Typography>
          </Grid>
          <Grid item xs={2} alignContent="end" textAlign="right">
            <Button sx={styles.dialogButton} onClick={handleClickOpen}>
              New
            </Button>
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Create New Recommendation</DialogTitle>
              <DialogContent>
                <Grid>
                  <Stack spacing={2}>
                    <DialogContentText />
                    <FormControl fullWidth>
                      <InputLabel id="pricebook-label">Pricebook</InputLabel>
                      <Select label="Pricebook" labelId="pricebook-label">
                        <MenuItem value="Slack">Slack Startup</MenuItem>
                        <MenuItem value="Automobile">Automobile</MenuItem>
                      </Select>
                      <FormHelperText>Leave empty to apply to all Pricebooks</FormHelperText>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="product-label">Product</InputLabel>
                      <Select
                        label="Product"
                        labelId="product-label"
                        value={product}
                        onChange={handleProductChange}>
                        <MenuItem value="Slack">Slack</MenuItem>
                      </Select>
                      <FormHelperText>Leave empty to apply to all Products</FormHelperText>
                    </FormControl>
                    {product && (
                      <>
                        <FormControl fullWidth>
                          <InputLabel id="tier-label">Tier</InputLabel>
                          <Select label="Tier" labelId="tier-label" />
                          <FormHelperText>Leave empty to apply to all Tier</FormHelperText>
                        </FormControl>
                        <FormControl fullWidth>
                          <InputLabel id="addon-label">Addon</InputLabel>
                          <Select label="Addon" labelId="addon-label" />
                          <FormHelperText>Choose to apply to a specific addon</FormHelperText>
                        </FormControl>
                      </>
                    )}
                    {useTerms && (
                      <FormControl fullWidth>
                        <InputLabel id="term-label">Deal Term</InputLabel>
                        <Select label="Deal Term" labelId="term-label">
                          <MenuItem>Payment Term</MenuItem>
                          <MenuItem>Billing Frequency</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    <TextField label="Best" />
                    <TextField label="Good" />
                    <TextField label="Least Preferred" />
                  </Stack>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleClose}>Save</Button>
              </DialogActions>
            </Dialog>
          </Grid>
        </Grid>
        <br />
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ fontWeight: 700 }}>
              <TableRow sx={{ fontWeight: 700 }}>
                <TableCell sx={{ fontWeight: 700 }}>Pricebook</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Addon</TableCell>
                <TableCell sx={{ backgroundColor: greenLight, fontWeight: 700 }}>Best</TableCell>
                <TableCell sx={{ backgroundColor: yellowLight, fontWeight: 700 }}>Good</TableCell>
                <TableCell sx={{ backgroundColor: redLight, fontWeight: 700 }}>
                  Least Preferred
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {discounting.map((item) => (
                <TableRow>
                  <TableCell>{item.pricebook || 'All'}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.tier}</TableCell>
                  <TableCell>{item.addon}</TableCell>
                  <TableCell sx={{ backgroundColor: greenLight }}>{item.green}</TableCell>
                  <TableCell sx={{ backgroundColor: yellowLight }}>{item.yellow}</TableCell>
                  <TableCell sx={{ backgroundColor: redLight }}>{item.red}</TableCell>
                  <TableCell>
                    <EditIcon />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <br />

      <Paper sx={pageStyle.formContainer}>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography variant="h5">Deal Term Recommendations</Typography>
          </Grid>
          <Grid item xs={2} alignContent="end" textAlign="right">
            <Button sx={styles.dialogButton} onClick={handleTermsClickOpen}>
              New
            </Button>
          </Grid>
        </Grid>
        <br />
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ fontWeight: 700 }}>
              <TableRow sx={{ fontWeight: 700 }}>
                <TableCell sx={{ fontWeight: 700 }}>Pricebook</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Addon</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Term</TableCell>

                <TableCell sx={{ backgroundColor: greenLight, fontWeight: 700 }}>Best</TableCell>
                <TableCell sx={{ backgroundColor: yellowLight, fontWeight: 700 }}>Good</TableCell>
                <TableCell sx={{ backgroundColor: redLight, fontWeight: 700 }}>
                  Least Preferred
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {dealTerms.map((item) => (
                <TableRow>
                  <TableCell>{item.pricebook || 'All'}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.tier}</TableCell>
                  <TableCell>{item.addon}</TableCell>
                  <TableCell>{item.term}</TableCell>

                  <TableCell sx={{ backgroundColor: greenLight }}>{item.green}</TableCell>
                  <TableCell sx={{ backgroundColor: yellowLight }}>{item.yellow}</TableCell>
                  <TableCell sx={{ backgroundColor: redLight }}>{item.red}</TableCell>
                  <TableCell>
                    <EditIcon />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default injectIntl(Settings);
