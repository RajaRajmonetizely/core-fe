import { Box, Grid, Paper } from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import TemplateClient from '../../api/Template/TemplateAPIs';
import { setRefetchData, setTemplates } from '../../store/template/template.slice';
import AddTemplate from './AddTemplate';
import ViewTemplates from './ViewTemplates';

interface IProps {
  intl?: any;
}

const Templates: React.FC<IProps> = (): ReactElement => {
  const ability = useSelector((state: any) => state.auth.ability);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const refetchData = useSelector((state: any) => state.template.refetchData);
  const dispatch = useDispatch();

  useEffect(() => {
    getTemplates();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (refetchData && ability.can('GET', 'Template Management')) getTemplates();
    // eslint-disable-next-line
  }, [refetchData]);

  const getTemplates = () => {
    setIsDataLoading(true);
    TemplateClient.getTemplates()
      .then((response) => {
        dispatch(setRefetchData(false));
        dispatch(setTemplates(response.data));
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
            {ability.can('POST', 'Template Management') ? <AddTemplate /> : null}
          </Box>
          <br />
          <ViewTemplates loader={isDataLoading} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default injectIntl(Templates);
