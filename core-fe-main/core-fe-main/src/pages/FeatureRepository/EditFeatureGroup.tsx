import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import FeatureRepositoryClient from '../../api/FeatureRepository/FeatureRepositoryAPI';
import DialogBox from '../../components/DialogBox/DialogBox';
import { getFeatureGroupFields } from '../../constants/dialogBoxConstants';
import { IFeatureGroup } from '../../models/repository';
import { hideEditFeatureGroupPopup } from '../../store/feature_repository/editFeatureGroup.slice';
import { REGEX } from '../../utils/helperService';

interface IProps {
  onEdit: (data: IFeatureGroup) => void;
  setLoader: (value: boolean) => void;
}

const EditFeatureGroup: React.FC<IProps> = ({ onEdit, setLoader }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.editFeatureGroup.isOpen);
  const featureGroupToEdit = useSelector((state: any) => state.editFeatureGroup.featureGroup);
  const [featureGroup, setFeatureGroup] = useState<any>('');

  const closePopup = () => {
    dispatch(hideEditFeatureGroupPopup());
  };
  const saveFeature = async () => {
    try {
      setLoader(true);
      dispatch(hideEditFeatureGroupPopup());
      const response = await FeatureRepositoryClient.editFeatureGroup(featureGroupToEdit.id, {
        name: featureGroup.name.trim(),
        external_name: featureGroup.external_name || null,
        external_description: featureGroup.external_description || null,
        features: featureGroup.features,
      } as IFeatureGroup);
      if (response.message === 'success') {
        onEdit({ ...featureGroup, ...response.data } as IFeatureGroup);
      }
      setLoader(false);
    } catch (e) {
      setLoader(false);
    }
  };
  useEffect(() => {
    setFeatureGroup(featureGroupToEdit);
  }, [featureGroupToEdit]);

  return (
    <DialogBox
      dialogConfig={{
        name: 'editFeatureGroup',
        fields: getFeatureGroupFields(featureGroup, setFeatureGroup),
        open: isOpen,
        handleClose: closePopup,
        handleSave: saveFeature,
        initialValues: {
          name: featureGroup.name ?? '',
          external_name: featureGroup.external_name ?? '',
          external_description: featureGroup.external_description ?? '',
        },
        schema: Yup.object({
          name: Yup.string()
            .trim()
            .required('Please enter feature group name')
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

export default EditFeatureGroup;
