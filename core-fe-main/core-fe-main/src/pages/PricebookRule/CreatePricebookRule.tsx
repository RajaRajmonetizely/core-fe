import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import _ from 'lodash';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import styles from '../../styles/styles';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import PriceBookClient from '../../api/PriceBook/PricebookAPI';
import PriceBookRuleClient from '../../api/PriceBookRules/PricebookRulesAPI';
import {
  setDesignations,
  setOppTypes,
  setPricebooks,
  setUsers,
} from '../../store/price_book_rules/createPriceBookRules.slice';
import {
  setEditData,
  setEditMode,
  setRefetchData,
} from '../../store/price_book_rules/pricebookRules.slice';

const CreatePricebook: React.FC<any> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const priceBooks = useSelector((state: any) => state.createPriceBookRules.priceBooks);
  const designations = useSelector((state: any) => state.createPriceBookRules.designations);
  const users = useSelector((state: any) => state.createPriceBookRules.users);
  const oppTypes = useSelector((state: any) => state.createPriceBookRules.oppTypes);
  const isEditMode = useSelector((state: any) => state.priceBookRules.isEditMode);
  const editPriceBookRuleData = useSelector(
    (state: any) => state.priceBookRules.editPriceBookRuleData,
  );
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  const [selectedPriceBook, setSelectedPriceBook] = useState<any>({});
  const [selectedDesignation, setSelectedDesignation] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<any>({});
  const [selectedOppType, setSelectedOppType] = useState<any>({});
  const [isPBRDialogOpen, setPBRDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    getPricebooks();
    getUsers();
    getDesignations();
    getOpportunityTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setSelectedPriceBook(
        priceBooks.find((pb: any) => pb.id === editPriceBookRuleData.price_book_id),
      );
      if (editPriceBookRuleData.user_id)
        setSelectedUser(users.find((u: any) => u.id === editPriceBookRuleData.user_id));
      if (editPriceBookRuleData.org_hierarchy_id)
        setSelectedDesignation(
          designations.find((u: any) => u.id === editPriceBookRuleData.org_hierarchy_id),
        );
      setSelectedOppType(
        oppTypes.find((u: any) => u.id === editPriceBookRuleData.opportunity_type_id),
      );
      openPBDialog();
    }
    // eslint-disable-next-line
  }, [isEditMode]);

  const getPricebooks = () => {
    PriceBookClient.getAllPriceBooks()
      .then(({ data }) => {
        dispatch(setPricebooks([...data]));
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  const getDesignations = () => {
    PriceBookRuleClient.getDesignations()
      .then(({ data }) => {
        dispatch(setDesignations(data));
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  const getUsers = () => {
    PriceBookRuleClient.getUsers()
      .then(({ data }) => {
        dispatch(setUsers(data));
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  const getOpportunityTypes = () => {
    PriceBookRuleClient.getOpportunityTypes()
      .then(({ data }) => {
        dispatch(setOppTypes(data));
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  const openPBDialog = () => {
    if (!isEditMode && oppTypes.length === 1) setSelectedOppType(oppTypes[0]);
    if (!isEditMode && priceBooks.length === 1) setSelectedPriceBook(priceBooks[0]);
    setPBRDialogOpen(true);
  };

  const handleClose = () => {
    setPBRDialogOpen(false);
    setSelectedPriceBook({});
    setSelectedUser({});
    setSelectedDesignation({});
    setSelectedOppType({});
    dispatch(setEditMode(false));
    dispatch(setEditData(false));
  };

  const isValidData = () => {
    let isValid = true;
    if (_.isEmpty(selectedPriceBook)) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseSelectPricebook' }),
      });
      isValid = false;
      return false;
    }
    if (_.isEmpty(selectedDesignation) && _.isEmpty(selectedUser)) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseSelectDesignationOrUser' }),
      });
      isValid = false;
      return false;
    }

    if (_.isEmpty(selectedOppType)) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseSelectOppType' }),
      });
      isValid = false;
      return false;
    }
    return isValid;
  };

  const handleSave = async () => {
    if (isValidData()) {
      try {
        setIsSaving(true);
        const ob: any = {
          price_book_id: selectedPriceBook.id,
          opportunity_type_id: selectedOppType.id,
        };
        ob.user_id = _.isEmpty(selectedUser) ? null : selectedUser.id;
        ob.org_hierarchy_id = _.isEmpty(selectedDesignation) ? null : selectedDesignation.id;

        if (isEditMode) {
          const resp = await PriceBookRuleClient.editPriceBookRule(editPriceBookRuleData.id, ob);
          if (resp.message === 'success') {
            dispatch(setRefetchData(true));
            dispatch(setEditMode(false));
            dispatch(setEditData(false));
            handleClose();
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'updateRuleMessage' }),
            });
            setIsSaving(false);
          }
        } else {
          const resp = await PriceBookRuleClient.createPriceBookRule(ob);
          if (resp.message === 'success') {
            dispatch(setRefetchData(true));
            handleClose();
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'createRuleMessage' }),
            });
            setIsSaving(false);
          }
        }
      } catch (e) {
        console.error(e);
        setIsSaving(false);
      }
    }
  };

  const PricebookRuleRow = useMemo((): ReactElement => {
    return (
      <Stack direction="row">
        <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
          <SearchAddAutocomplete
            caption="pricebook"
            data={priceBooks}
            selectedItem={selectedPriceBook || {}}
            setSelectedData={(value: any) => {
              setSelectedPriceBook(value);
            }}
            showAddOption={false}
            showSelectionValue
          />
        </FormControl>
        <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
          <SearchAddAutocomplete
            caption="designation"
            data={designations}
            selectedItem={selectedDesignation || {}}
            setSelectedData={(value: any) => {
              setSelectedDesignation(value);
              setSelectedUser({});
            }}
            showAddOption={false}
            showSelectionValue
          />
        </FormControl>
        <Typography sx={{ margin: '35px 10px', fontWeight: '600' }}>OR</Typography>
        <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
          <SearchAddAutocomplete
            caption="user"
            data={users}
            selectedItem={selectedUser || {}}
            setSelectedData={(value: any) => {
              setSelectedUser(value);
              setSelectedDesignation({});
            }}
            showAddOption={false}
            showSelectionValue
          />
        </FormControl>
        <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
          <SearchAddAutocomplete
            caption="opportunityType"
            data={oppTypes}
            selectedItem={selectedOppType || {}}
            setSelectedData={(value: any) => {
              setSelectedOppType(value);
            }}
            showAddOption={false}
            showSelectionValue
          />
        </FormControl>
      </Stack>
    );
    // eslint-disable-next-line
  }, [
    priceBooks,
    selectedPriceBook,
    selectedDesignation,
    selectedUser,
    selectedOppType,
    designations,
    users,
    oppTypes,
  ]);

  return (
    <>
      <Button
        sx={styles.dialogButton}
        onClick={() => {
          openPBDialog();
        }}>
        <FormattedMessage id="createPricebookRule" />
      </Button>
      <Dialog open={isPBRDialogOpen} maxWidth="lg">
        <DialogTitle>
          <FormattedMessage id={isEditMode ? 'editPriceBookRule' : 'createPricebookRule'} />
        </DialogTitle>
        <DialogContent dividers>
          <Grid>
            <Stack>
              <Grid item md={12}>
                <Stack direction="row">
                  <Typography width="290px" className="dialogHeading">
                    <FormattedMessage id="pricebook" />
                  </Typography>
                  <Typography width="335px" className="dialogHeading">
                    <FormattedMessage id="designation" />
                  </Typography>
                  <Typography width="290px" className="dialogHeading">
                    <FormattedMessage id="user" />
                  </Typography>
                  <Typography width="290px" className="dialogHeading">
                    <FormattedMessage id="opportunityType" />
                  </Typography>
                </Stack>
                <Divider />
                {PricebookRuleRow}
              </Grid>
            </Stack>
          </Grid>
          <DialogActions>
            <Button sx={styles.dialogButton} onClick={handleClose}>
              <FormattedMessage id="cancel" />
            </Button>
            <Button sx={styles.dialogButton} onClick={() => handleSave()}>
              {isSaving ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                <FormattedMessage id="save" />
              )}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </>
  );
};
export default injectIntl(CreatePricebook);
