import React from 'react';
import { injectIntl } from 'react-intl';
import Mapping from './Mapping';

interface IProps {
  intl?: any;
}

const Opportunity: React.FC<IProps> = () => {
  return (
    <Mapping
      mappingName="Opportunity"
      mappingKey="opportunity"
      params={{ sobject: 'Opportunity', db_model: 'Opportunity' }}
    />
  );
};

export default injectIntl(Opportunity);
