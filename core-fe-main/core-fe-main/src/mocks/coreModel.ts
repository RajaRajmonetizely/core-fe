import { v4 as uuidv4 } from 'uuid';

export const linearColumns = [
  {
    name: 'To-From Unit Range',
    id: uuidv4(),
    width: 392,
    subColumns: [
      {
        name: 'To',
        id: uuidv4(),
        key: 'to',
      },
      {
        name: 'From',
        id: uuidv4(),
        key: 'from',
      },
    ],
  },
  {
    name: 'Transaction fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'transaction_fee',
  },

  {
    name: 'Overage fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'overage_fee',
  },
];

export const twoPartPlatformFeeColumns = [
  {
    name: 'To-From Unit Range',
    id: uuidv4(),
    width: 392,
    subColumns: [
      {
        name: 'To',
        id: uuidv4(),
        key: 'to',
      },
      {
        name: 'From',
        key: 'from',
        id: uuidv4(),
      },
    ],
  },
  {
    name: 'Transaction fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'transaction_fee',
  },
  {
    name: 'Platform Fee',
    id: uuidv4(),
    width: 300,
    key: 'platform_fee',
  },

  {
    name: 'Overage fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'overage_fee',
  },
];

export const twoPartMinCommitColumns = [
  {
    name: 'To-From Unit Range',
    id: uuidv4(),
    width: 392,
    subColumns: [
      {
        name: 'To',
        id: uuidv4(),
        key: 'to',
      },
      {
        name: 'From',
        id: uuidv4(),
        key: 'from',
      },
    ],
  },
  {
    name: 'Transaction fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'transaction_fee',
  },
  {
    name: 'Minimum Committed Units',
    id: uuidv4(),
    width: 300,
    key: 'minimum_committed_units',
  },
  {
    name: 'Overage fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'overage_fee',
  },
];

export const threePartColumns = [
  {
    name: 'Upto Unit Range',
    id: uuidv4(),
    width: 392,
    subColumns: [
      {
        name: 'Up',
        id: uuidv4(),
        key: 'up',
      },
      {
        name: 'To',
        id: uuidv4(),
        key: 'to',
      },
    ],
  },
  {
    name: 'Transaction fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'transaction_fee',
  },
  {
    name: 'Overage fee per unit',
    id: uuidv4(),
    width: 300,
    key: 'overage_fee',
  },
];

export const rangeColumns = [
  {
    name: 'Low',
    id: uuidv4(),
    key: 'low',
  },
  {
    name: 'High',
    id: uuidv4(),
    key: 'high',
  },
];
