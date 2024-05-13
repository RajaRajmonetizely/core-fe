import { v4 as uuidv4 } from 'uuid';

export const columns = [
  { name: '', id: 'col1' },
  { name: '', id: 'col2' },
  { name: 'Small', id: 'small' },
  { name: 'Medium', id: 'medium' },
  { name: 'Large', id: 'large' },
];

export const rows = [
  {
    col1: 'Pro',
    col2: 'Units',
    small: '',
    medium: '',
    large: '',
    rowType: 'input',
    isTier: true,
    key: uuidv4(),
  },
  {
    col1: '',
    col2: 'Base Fee',
    small: '',
    medium: '',
    large: '',
    rowType: 'baseFee',
    key: uuidv4(),
  },
];

export const totalRowObject = {
  col1: 'Total',
  col2: '',
  small: '',
  medium: '',
  large: '',
  rowType: 'total',
  key: uuidv4(),
};
