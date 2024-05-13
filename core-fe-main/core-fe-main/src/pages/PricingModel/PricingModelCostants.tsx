import { FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import AddOns from './AddOns';
import CoreModel from './CoreModel';
import DealSimulation from './DealSimulation';
import PriceCurve from './PriceCurve';

const tabs = [
  {
    label: <FormattedMessage id="coreModel" />,
    id: uuidv4(),
    component: <CoreModel />,
  },
  {
    label: <FormattedMessage id="addOns" />,
    id: uuidv4(),
    component: <AddOns />,
  },
  {
    label: <FormattedMessage id="priceCurve" />,
    id: uuidv4(),
    component: <PriceCurve />,
  },
  {
    label: <FormattedMessage id="dealSimulation" />,
    id: uuidv4(),
    component: <DealSimulation />,
  },
];

export default tabs;
