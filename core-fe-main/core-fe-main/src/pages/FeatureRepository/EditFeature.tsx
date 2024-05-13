import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import FeatureRepositoryClient from '../../api/FeatureRepository/FeatureRepositoryAPI';
import DialogBox from '../../components/DialogBox/DialogBox';
import { getFeatureFields } from '../../constants/dialogBoxConstants';
import { IFeature } from '../../models/repository';
import { hideEditFeaturePopup } from '../../store/feature_repository/editFeature.slice';
import { REGEX } from '../../utils/helperService';

interface IProps {
  onEdit: (data: IFeature) => void;
  setLoader: (value: boolean) => void;
}

const EditFeature: React.FC<IProps> = ({ onEdit, setLoader }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.editFeature.isOpen);
  const featureToEdit = useSelector((state: any) => state.editFeature.feature);
  const [feature, setFeature] = useState<IFeature>({} as IFeature);

  const closePopup = () => {
    dispatch(hideEditFeaturePopup());
  };

  const saveFeature = async () => {
    try {
      setLoader(true);
      dispatch(hideEditFeaturePopup());
      const response = await FeatureRepositoryClient.editFeature(featureToEdit.id, {
        name: feature.name.trim(),
        external_name: feature.external_name || null,
        external_description: feature.external_description || null,
      } as IFeature);
      if (response.message === 'success') {
        onEdit(response.data);
      }
      setLoader(false);
    } catch (e) {
      setLoader(false);
    }
  };

  useEffect(() => {
    setFeature(featureToEdit);
  }, [featureToEdit]);

  return (
    <DialogBox
      dialogConfig={{
        name: 'editFeature',
        fields: getFeatureFields(feature, setFeature),
        open: isOpen,
        handleClose: closePopup,
        handleSave: saveFeature,
        initialValues: {
          name: feature.name ?? '',
          external_name: feature.external_name ?? '',
          external_description: feature.external_description ?? '',
        },
        schema: Yup.object({
          name: Yup.string()
            .trim()
            .required('Please enter feature name')
            .matches(
              REGEX,
              'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
            ),
          external_name: Yup.string(),
          external_description: Yup.string(),
        }),
      }}
    />
  );
};

export default EditFeature;
