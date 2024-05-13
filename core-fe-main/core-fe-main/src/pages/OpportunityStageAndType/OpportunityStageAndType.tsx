import EditIcon from '@mui/icons-material/Edit';
import { Box, Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { injectIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import OpportunityClient from '../../api/Opportunity/OpportunityAPI';
import DialogBox from '../../components/DialogBox/DialogBox';
import SearchAddCard from '../../components/SearchAddCard/SearchAddCard';
import Snackbar from '../../components/Snackbar/Snackbar';
import { getStageFields, getTypeFields } from '../../constants/dialogBoxConstants';
import { ISnackBar } from '../../models/common';
import { REGEX } from '../../utils/helperService';

const OpportunityStageAndType: React.FC<any> = ({ intl }) => {
  const ability = useSelector((state: any) => state.auth.ability);
  const [isDataLoading, setIsDataLoading] = useState<any>(false);
  const [addStageOption, setAddStageOption] = useState<any>({});
  const [addTypeOption, setAddTypeOption] = useState<any>({});
  const [stage, setStage] = useState<any>([]);
  const [type, setType] = useState<any>([]);
  const [stageData, setStageData] = useState<any>({});
  const [typeData, setTypeData] = useState<any>({});
  const [selectedStage, setSelectedStage] = useState<any>({});
  const [selectedType, setSelectedType] = useState<any>({});
  const [open, toggleOpen] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  const getOpportunityStage = () => {
    setIsDataLoading(true);
    OpportunityClient.getOpportunityStage()
      .then(({ data }) => {
        setStage([...data]);
        setIsDataLoading(false);
      })
      .catch((e: any) => {
        console.error(e);
        setIsDataLoading(false);
      });
  };

  const getOpportunityType = () => {
    setIsDataLoading(true);
    OpportunityClient.getOpportunityType()
      .then(({ data }) => {
        setType([...data]);
        setIsDataLoading(false);
      })
      .catch((e: any) => {
        console.error(e);
        setIsDataLoading(false);
      });
  };

  useEffect(() => {
    if (ability.can('GET', 'Opportunity')) {
      getOpportunityStage();
      getOpportunityType();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStageData(selectedStage);
  }, [selectedStage]);

  useEffect(() => {
    setTypeData(selectedType);
  }, [selectedType]);

  const onStageSelected = (item: any): any => {
    setSelectedField('Stage');
    setSelectedStage(item);
    toggleOpen(true);
  };

  const onTypeSelected = (item: any): any => {
    setSelectedField('Type');
    setSelectedType(item);
    toggleOpen(true);
  };

  const stageEditConfig: any = [
    {
      icon: <EditIcon />,
      onClickHandler: onStageSelected,
    },
  ];

  const typeEditConfig: any = [
    {
      icon: <EditIcon />,
      onClickHandler: onTypeSelected,
    },
  ];

  const onEditStage = () => {
    OpportunityClient.editOpportunityStage(selectedStage.id, {
      name: stageData.name,
    })
      .then(({ data }) => {
        const updatedStageList = stage.map((stageItem: any) => {
          if (stageItem.id === data.id) {
            stageItem.name = data.name;
            return stageItem;
          }
          return stageItem;
        });
        setStage(updatedStageList);
        toggleOpen(false);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'editStageSuccess' }),
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const onEditType = () => {
    OpportunityClient.editOpportunityType(selectedType.id, {
      name: typeData.name,
    })
      .then(({ data }) => {
        const updatedTypeList = type.map((typeItem: any) => {
          if (typeItem.id === data.id) {
            typeItem.name = data.name;
            return typeItem;
          }
          return typeItem;
        });
        setType(updatedTypeList);
        toggleOpen(false);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'editTypeSuccess' }),
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleStageDialogClose = () => {
    setSelectedField('');
    setStageData({});
    setSelectedStage({});
    toggleOpen(false);
  };

  const handleTypeDialogClose = () => {
    setSelectedField('');
    setTypeData({});
    setSelectedType({});
    toggleOpen(false);
  };

  useEffect(() => {
    if (
      addStageOption?.name &&
      stage?.findIndex((s: any) => s.name === addStageOption.name) === -1
    ) {
      if (ability.can('POST', 'Opportunity'))
        OpportunityClient.addOpportunityStage({ name: addStageOption.name })
          .then(({ data }) => {
            setStage((prevList: any) => [...prevList, data]);
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'addStageSuccess' }),
            });
          })
          .catch((err) => {
            console.error(err);
          });
      else
        setSnackBarValues({
          display: true,
          type: 'error',
          message: intl.formatMessage({ id: 'notAllowedMessage' }),
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addStageOption]);

  useEffect(() => {
    if (addTypeOption?.name && type?.findIndex((t: any) => t.name === addTypeOption.name) === -1) {
      if (ability.can('POST', 'Opportunity'))
        OpportunityClient.addOpportunityType({ name: addTypeOption.name })
          .then(({ data }) => {
            setType((prevList: any) => [...prevList, data]);
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'addTypeSuccess' }),
            });
          })
          .catch((err) => {
            console.error(err);
          });
      else
        setSnackBarValues({
          display: true,
          type: 'error',
          message: intl.formatMessage({ id: 'notAllowedMessage' }),
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addTypeOption]);

  const onDragEnd = () => {};

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box
        sx={{
          marginRight: '30px',
          marginLeft: '10px',
          height: '86vh',
          borderRadius: '6px',
        }}>
        <Grid container spacing={4}>
          <Grid item>
            <SearchAddCard
              caption="searchOrAddStage"
              cardHeader="stage"
              isDragDisabled
              data={stage}
              loading={isDataLoading}
              setAddOption={setAddStageOption}
              actionConfig={ability.can('PUT', 'Opportunity') && stageEditConfig}
              showProgress={isDataLoading}
            />
          </Grid>
          <Grid item>
            <SearchAddCard
              caption="searchOrAddType"
              isDragDisabled
              cardHeader="type"
              data={type}
              loading={isDataLoading}
              setAddOption={setAddTypeOption}
              actionConfig={ability.can('PUT', 'Opportunity') && typeEditConfig}
              showProgress={isDataLoading}
            />
          </Grid>
          <DialogBox
            dialogConfig={
              selectedField === 'Type'
                ? {
                    name: 'editType',
                    fields: getTypeFields(typeData, setTypeData),
                    open,
                    handleClose: handleTypeDialogClose,
                    handleSave: onEditType,
                    initialValues: {
                      name: typeData.name ?? '',
                    },
                    schema: Yup.object({
                      name: Yup.string()
                        .trim()
                        .required('Please enter type name')
                        .matches(
                          REGEX,
                          'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
                        ),
                    }),
                  }
                : {
                    name: 'editStage',
                    fields: getStageFields(stageData, setStageData),
                    open,
                    handleClose: handleStageDialogClose,
                    handleSave: onEditStage,
                    initialValues: {
                      name: stageData.name ?? '',
                    },
                    schema: Yup.object({
                      name: Yup.string()
                        .trim()
                        .required('Please enter stage name')
                        .matches(
                          REGEX,
                          'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
                        ),
                    }),
                  }
            }
          />
        </Grid>
      </Box>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </DragDropContext>
  );
};

export default injectIntl(OpportunityStageAndType);
