import React from 'react';
import { injectIntl } from 'react-intl';
import Mapping from './Mapping';

interface IProps {
  intl?: any;
}

const Contract: React.FC<IProps> = () => {
  return (
    <Mapping
      mappingName="Contract"
      mappingKey="contract"
      params={{ sobject: 'Contract', db_model: 'Contract' }}
    />
  );
};

export default injectIntl(Contract);
