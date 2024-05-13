export const pricingCurve = [
  {
    name: '250',
    pro: 4000,
    elite: 2400,
    total: 2400,
  },
  {
    name: '500',
    pro: 3000,
    elite: 1398,
    total: 2210,
  },
  {
    name: '1000',
    pro: 2000,
    elite: 9800,
    total: 2290,
  },
  {
    name: '2000',
    pro: 2780,
    elite: 3908,
    total: 2000,
  },
  {
    name: '3000',
    pro: 1890,
    elite: 4800,
    total: 2181,
  },
  {
    name: '4000',
    pro: 2390,
    elite: 3800,
    total: 2500,
  },
  {
    name: '5000',
    pro: 3490,
    elite: 4300,
    total: 2100,
  },
];

export const pricingCurveTiers = [
  {
    name: 'Pro',
    id: '0',
    color: '#A154F2',
  },
  {
    name: 'Elite',
    id: '1',
    color: '#EF5DA8',
  },
];

export const addonData = {
  columns: [
    { name: 'Config Add-Ons', id: 'addon' },
    { name: 'Essential', id: '1' },
    { name: 'Pro', id: '2' },
    { name: 'Elite', id: '3' },
    { name: 'Elite', id: '4' },
    { name: 'Elite', id: '5' },
    { name: 'Elite', id: '6' },
    { name: 'Elite', id: '7' },
  ],
  values: [
    { addon: 'SMS', '2': '', '3': '', sell_multiple: true, quantity: 0 },
    { addon: 'whatsapp', '1': '', '3': '', sell_multiple: false, quantity: 0 },
    { addon: 'email', '1': '', sell_multiple: true, quantity: 0 },
    { addon: 'email', '1': '', sell_multiple: true, quantity: 0 },
    { addon: 'email', '1': '', sell_multiple: true, quantity: 0 },
  ],
};

export const configContractData = {
  id: '79052232-b696-4dae-98a0-9de37ba5c1c1',
  name: 'Model 2',
  package_id: '6185f51d-21a8-4c2a-895e-9f9e6eacf48f',
  metric_details: [
    {
      id: '14196b8b-0528-4780-943e-834b40c3abe3',
      name: 'users',
    },
  ],
  pricing_structure_id: '781d7e7a-6448-4dc7-83b4-2b9d955d65dd',
  pricing_structure_name: 'Linear Model',
  details: [
    {
      pricing_model_detail_id: '92e214a6-de25-48af-824a-666d400c7725',
      tier_id: '7c3132d4-fdad-4408-87d5-6676724f6247',
      tier_name: 'Best',
      details: {
        addons: [
          {
            id: 'eb37ef52-4ce9-4756-b0ba-7afe396acf3c',
            addOnFeatures: 'Featuer 1',
            is_custom_metric: false,
            details: {
              model: 'Fixed Price',
              fee: '12',
              min: null,
              max: null,
              sell_multiple: false,
            },
            metric_details: [],
          },
          {
            id: '7593f204-38c4-4897-8f81-476dd3c879e6',
            addOnFeatures: 'Feature 2',
            is_custom_metric: false,
            details: {
              model: 'Proportion of core model',
              fee: '20',
              min: '100',
              max: '500',
              sell_multiple: false,
            },
            metric_details: [],
          },
        ],
        core: {
          columns: [
            {
              name: 'Metric range',
              sub_columns: [
                {
                  name: 'low',
                  key: 'low',
                },
                {
                  name: 'high',
                  key: 'high',
                },
              ],
              key: 'metric_range',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Transaction fee',
              sub_columns: [],
              key: 'transaction_fee',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Overage fee',
              sub_columns: [],
              key: 'overage_fee',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Output',
              sub_columns: [],
              key: 'output',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: true,
              formula: 'LOOKUP(metric_range: transaction_fee * units)',
            },
          ],
          values: [
            {
              metric_range: {
                low: 1,
                high: 250,
              },
              transaction_fee: 0.02,
              overage_fee: 0.234,
            },
            {
              metric_range: {
                low: 251,
                high: 500,
              },
              transaction_fee: 0.23,
              overage_fee: 0.12,
            },
            {
              metric_range: {
                low: 501,
                high: 700,
              },
              transaction_fee: 0.03,
              overage_fee: 0.2,
            },
          ],
        },
      },
    },
    {
      pricing_model_detail_id: '37710e70-cba8-4b02-a3e8-900f52f05cd0',
      tier_id: 'e543a1e4-e090-4bed-9f0d-54c63fc0194d',
      tier_name: 'Better',
      details: {
        addons: [
          {
            id: '952d5ea8-1374-403d-a78a-6dd16c60d871',
            addOnFeatures: 'Feature 4',
            is_custom_metric: false,
            details: {
              model: 'Fixed Price',
              fee: '89',
              min: null,
              max: null,
              sell_multiple: true,
            },
            metric_details: [],
          },
          {
            id: 'd02d7bde-4652-427e-960b-37d6f22226d3',
            addOnFeatures: 'Feature 3',
            is_custom_metric: false,
            details: {
              model: 'Proportion of core model',
              fee: '78',
              min: '67',
              max: '89',
              sell_multiple: false,
            },
            metric_details: [],
          },
        ],
        core: {
          columns: [
            {
              name: 'Metric range',
              sub_columns: [
                {
                  name: 'low',
                  key: 'low',
                },
                {
                  name: 'high',
                  key: 'high',
                },
              ],
              key: 'metric_range',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Transaction fee',
              sub_columns: [],
              key: 'transaction_fee',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Overage fee',
              sub_columns: [],
              key: 'overage_fee',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Output',
              sub_columns: [],
              key: 'output',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: true,
              formula: 'LOOKUP(metric_range: transaction_fee * units)',
            },
          ],
          values: [
            {
              metric_range: {
                low: 1,
                high: 250,
              },
              transaction_fee: 0.24,
              overage_fee: 0.223,
            },
            {
              metric_range: {
                low: 251,
                high: 500,
              },
              transaction_fee: 0.24,
              overage_fee: 0.345,
            },
            {
              metric_range: {
                low: 501,
                high: 750,
              },
              transaction_fee: 0.4,
              overage_fee: 0.5,
            },
          ],
        },
      },
    },
    {
      pricing_model_detail_id: 'cddf1519-e27a-4e25-afd1-cbb6b47e736e',
      tier_id: '5ebb35c2-eb54-4891-b95d-0cd03add9841',
      tier_name: 'Good',
      details: {
        addons: [
          {
            id: 'd02d7bde-4652-427e-960b-37d6f22226d3',
            addOnFeatures: 'Feature 3',
            is_custom_metric: false,
            details: {
              model: 'Fixed Price',
              fee: '12',
              min: null,
              max: null,
              sell_multiple: true,
            },
            metric_details: [],
          },
          {
            id: '7593f204-38c4-4897-8f81-476dd3c879e6',
            addOnFeatures: 'Feature 2',
            is_custom_metric: false,
            details: {
              model: 'Proportion of core model',
              fee: '14',
              min: '16',
              max: '30',
              sell_multiple: false,
            },
            metric_details: [],
          },
        ],
        core: {
          columns: [
            {
              name: 'Metric range',
              sub_columns: [
                {
                  name: 'low',
                  key: 'low',
                },
                {
                  name: 'high',
                  key: 'high',
                },
              ],
              key: 'metric_range',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Transaction fee',
              sub_columns: [],
              key: 'transaction_fee',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Overage fee',
              sub_columns: [],
              key: 'overage_fee',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: false,
              formula: null,
            },
            {
              name: 'Output',
              sub_columns: [],
              key: 'output',
              is_input_column: true,
              is_output_column: false,
              is_metric_column: false,
              metric_id: null,
              has_formula: true,
              formula: 'LOOKUP(metric_range: transaction_fee * units)',
            },
          ],
          values: [
            {
              metric_range: {
                low: 1,
                high: 250,
              },
              transaction_fee: 0.24,
              overage_fee: 0.234,
            },
            {
              metric_range: {
                low: 251,
                high: 500,
              },
              transaction_fee: 0.23,
              overage_fee: 0.19,
            },
            {
              metric_range: {
                low: 501,
                high: 750,
              },
              transaction_fee: 0.4,
              overage_fee: 0.5,
            },
          ],
        },
      },
    },
  ],
};
