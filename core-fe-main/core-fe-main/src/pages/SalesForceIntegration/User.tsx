import React from 'react';
import { injectIntl } from 'react-intl';
import Mapping from './Mapping';

interface IProps {
  intl: any;
}

const User: React.FC<IProps> = () => {
  return (
    <Mapping mappingName="User" mappingKey="user" params={{ sobject: 'User', db_model: 'User' }} />
  );
};

export default injectIntl(User);
