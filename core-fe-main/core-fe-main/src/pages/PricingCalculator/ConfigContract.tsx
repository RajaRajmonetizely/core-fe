import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Tab,
  Tabs,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import PricingStructureTable from '../../components/PricingStructureTable/PricingStructureTable';
import { ReactComponent as UnlockIcon } from '../../assets/icons/unlock.svg';
import styles from '../../styles/styles';
import ContractClient from '../../api/Contract/ContractAPI';

const componentStyle = {
  dialogHeader: {
    display: 'flex',
  },
  headerText: {
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: '#4168E1',
    textAlign: 'center',
    marginBottom: '28px',
    marginLeft: 'auto',
    marginTop: '6px',
  },
  closeIconStyle: {
    marginLeft: 'auto',
    marginTop: 'auto',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
  },
  inputStyle: {
    width: '100%',
    color: '#3B3F4D',
    fontFamily: 'Helvetica',
    fontWeight: 400,
    '& fieldset': { border: 'none' },
  },
  actionBtn: {
    borderTop: '1px solid #E5E5E5',
  },
  box: (item: any) => {
    return {
      width: '16px',
      height: '16px',
      border: '1px solid #C4C4C4',
      borderRadius: '3px',
      marginRight: '12px',
      backgroundColor: item.checked ? '#C4C4C4' : 'white',
      marginTop: 'auto',
      marginBottom: 'auto',
    };
  },
  infoText: {
    color: '#000000',
    fontFamily: 'Helvetica',
    fontWeight: 400,
    maxWidth: '300px',
  },
  infoMarginBtm: {
    marginBottom: '12px',
  },
  infoContainer: {
    display: 'flex',
    flexShrink: 0,
  },
  leftAuto: {
    marginLeft: 'auto',
  },
  toggleContainer: {
    display: 'flex',
    marginTop: '12px',
    marginBottom: '12px',
  },
  unlockIcon: {
    marginRight: '11px',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  emptyBox: {
    width: '300px',
  },
  loaderStyle: {
    color: 'white',
  },
};

interface IProps {
  intl: any;
  open: boolean;
  selectedQuote: any;
  loader: boolean;
  selectedProductIds: string[];
  onClose: () => void;
  updateContractSpecificData: (data: any) => void;
}

const ConfigContract: React.FC<IProps> = ({
  intl,
  open,
  selectedQuote,
  loader,
  onClose,
  selectedProductIds,
  updateContractSpecificData,
}) => {
  const [configSpecificData, setConfigSpecificData] = useState<any>([]);
  const [selectedTabs, setSelectedTabs] = React.useState<number[]>(
    Array(configSpecificData.length).fill(0),
  );

  useEffect(() => {
    if (selectedQuote.id)
      ContractClient.getContractSpecificConfig(selectedQuote.id)
        .then((resp: any) => {
          if (resp.message === 'success') {
            setConfigSpecificData(resp.data);
            setSelectedTabs(resp.data.map(() => 0));
          }
        })
        .catch((e) => {
          console.error(e);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuote]);

  const handleChange = (event: React.SyntheticEvent, newValue: number, configIndex: number) => {
    setSelectedTabs((prevSelectedTabs) => {
      const updatedSelectedTabs = [...prevSelectedTabs];
      updatedSelectedTabs[configIndex] = newValue;
      return updatedSelectedTabs;
    });
  };
  const onRowSelect = (index: number, configIndex: number) => {
    setConfigSpecificData((prevData: any) => {
      const updatedData = [...prevData];
      const config = updatedData[configIndex];
      const tier = config.tiers[selectedTabs[configIndex]];
      tier.details.values[index].is_selected = !tier.details.values[index].is_selected;
      return updatedData;
    });
  };

  const onColSelect = (colIndex: number, subColIndex: number | null, configIndex: number) => {
    setConfigSpecificData((prevData: any) => {
      const updatedData = [...prevData];
      const config = updatedData[configIndex];
      const tier = config.tiers[selectedTabs[configIndex]];
      const column =
        subColIndex !== null && subColIndex !== undefined
          ? tier.details.columns[colIndex].sub_columns[subColIndex]
          : tier.details.columns[colIndex];

      column.is_selected = !column.is_selected;
      return updatedData;
    });
  };

  const onTextChange = (
    configIndex: number,
    value: any,
    rowIndex: number,
    column: any,
    subKey?: string,
  ) => {
    setConfigSpecificData((prevData: any) => {
      const updatedData = [...prevData];
      const config = updatedData[configIndex];
      const tier = config.tiers[selectedTabs[configIndex]];
      const details = tier.details.values[rowIndex];
      if (subKey) {
        if (!details[column.key]) {
          details[column.key] = {};
        }
        details[column.key][subKey] = value;
      } else {
        details[column.key] = value;
      }
      return updatedData;
    });
  };

  return (
    <Dialog fullWidth maxWidth="lg" open={open}>
      <DialogContent>
        <Box sx={componentStyle.dialogHeader}>
          <Box sx={componentStyle.emptyBox} />
          <Box sx={componentStyle.headerText}>
            {intl.formatMessage({ id: 'contract_specific_config' })}
          </Box>
          <Box sx={componentStyle.leftAuto}>
            <Box sx={[componentStyle.infoContainer, componentStyle.infoMarginBtm]}>
              <Box sx={componentStyle.box({ checked: true })} />
              <Box sx={componentStyle.infoText}>
                {intl.formatMessage({ id: 'selectRowColumns' })}
              </Box>
            </Box>
            <Box sx={componentStyle.infoContainer}>
              <Box sx={componentStyle.unlockIcon}>
                <UnlockIcon />
              </Box>
              <Box sx={componentStyle.infoText}>{intl.formatMessage({ id: 'unlockColumns' })}</Box>
            </Box>
          </Box>
        </Box>
        <Box>
          {configSpecificData.map((config: any, configIndex: number) => (
            <Box key={config.product_id}>
              {selectedProductIds.includes(config.product_id) ? (
                <>
                  <Tabs
                    value={selectedTabs[configIndex]}
                    onChange={(event, newValue) => handleChange(event, newValue, configIndex)}
                    textColor="secondary"
                    sx={{ marginTop: '8px' }}
                    indicatorColor="secondary">
                    {config?.tiers?.map((t: any) => {
                      return (
                        <Tab
                          key={t.tier_id}
                          label={t.tier_name}
                          sx={{ borderBottom: '2px solid  #C3C3CF', ...styles.tabLabelStyle }}
                        />
                      );
                    })}
                  </Tabs>
                  <Box>
                    <PricingStructureTable
                      readOnly={false}
                      showBlock
                      selectedPricingStructure={{}}
                      onEdit={() => {}}
                      onTextChange={(value, rowIndex, column, subColIndex) =>
                        onTextChange(configIndex, value, rowIndex, column, subColIndex)
                      }
                      onRowChecked={(index) => onRowSelect(index, configIndex)}
                      onColumnChecked={(colIndex, subColIndex) =>
                        onColSelect(colIndex, subColIndex, configIndex)
                      }
                      rows={config.tiers[selectedTabs[configIndex]]?.details.values ?? []}
                      columns={config.tiers[selectedTabs[configIndex]]?.details.columns ?? []}
                    />
                  </Box>
                </>
              ) : null}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={componentStyle.actionBtn}>
        <Button sx={styles.dialogButton} onClick={onClose}>
          {intl.formatMessage({ id: 'cancel' })}
        </Button>
        <Button
          onClick={() => {
            updateContractSpecificData(configSpecificData);
          }}
          sx={styles.dialogButton}>
          {loader ? (
            <CircularProgress sx={componentStyle.loaderStyle} size={24} />
          ) : (
            intl.formatMessage({ id: 'save' })
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default injectIntl(ConfigContract);
