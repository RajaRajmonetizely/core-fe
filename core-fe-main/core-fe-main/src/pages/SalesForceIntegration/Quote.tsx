import React from 'react';
import { injectIntl } from 'react-intl';
import Mapping from './Mapping';

interface IProps {
  intl?: any;
}

const Quote: React.FC<IProps> = () => {
  return (
    <Mapping
      mappingName="Quote"
      mappingKey="quote"
      params={{ sobject: 'Quote__c', db_model: 'Quote' }}
    />
  );
};

export default injectIntl(Quote);
