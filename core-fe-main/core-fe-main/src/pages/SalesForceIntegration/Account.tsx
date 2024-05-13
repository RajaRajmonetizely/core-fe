import React from 'react';
import { injectIntl } from 'react-intl';
import Mapping from './Mapping';

interface IProps {
  intl?: any;
}

const Account: React.FC<IProps> = () => {
  return (
    <Mapping
      mappingName="Account"
      mappingKey="account"
      params={{ sobject: 'Account', db_model: 'Account' }}
    />
  );
};

export default injectIntl(Account);
