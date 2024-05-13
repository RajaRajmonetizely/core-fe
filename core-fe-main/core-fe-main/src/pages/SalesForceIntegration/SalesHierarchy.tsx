import React from 'react';
import { injectIntl } from 'react-intl';
import Mapping from './Mapping';

interface IProps {
  intl?: any;
}

const SalesHierarchy: React.FC<IProps> = () => {
  return (
    <Mapping
      mappingName="OrgHierarchy"
      mappingKey="salesHierarchy"
      params={{ sobject: 'UserRole', db_model: 'OrgHierarchy' }}
    />
  );
};

export default injectIntl(SalesHierarchy);
