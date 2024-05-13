export const pricingTableColumn = [
  { name: 'Quantity', key: 'qty' },
  { name: 'List Unit Price', key: 'list_unit_price' },
  { name: 'Discounted Unit Price', key: 'discounted_unit_price' },
  { name: 'List Total Price', key: 'list_total_price' },
  { name: 'Discounting %', key: 'discounting' },
  { name: 'Discounted Total Price', key: 'discounted_total_price' },
];

export const pricingTableRows = [
  {
    product_id: '80f00867-fb90-4442-ad08-327bcbffa0fe',
    product_name: 'CRM',
    tiers: [
      {
        tier_id: '99e44d1b-1c76-4a46-a9f5-68ccaec443e5',
        tier_name: 'Essentials',
        total: [
          { key: 'qty', value: 'NA' },
          { key: 'list_unit_price', value: 'NA' },
          { key: 'discounted_unit_price', value: 'NA' },
          { key: 'list_total_price', value: 51500 },
          { key: 'discounting', value: 15.56 },
          { key: 'discounted_total_price', value: 43500 },
        ],
        details: {
          core: {
            rows: [
              {
                name: 'Subscription',
                driving_field: 'Platform Fee',
                values: [
                  { key: 'qty', value: 1000 },
                  { key: 'list_unit_price', value: 10000 },
                  { key: 'discounted_unit_price', value: 8000 },
                  { key: 'list_total_price', value: 100000000 },
                  { key: 'discounting', value: 20 },
                  { key: 'discounted_total_price', value: 80000000 },
                ],
              },
              {
                name: 'Usage',
                driving_field: 'Transaction Fee',
                values: [
                  { key: 'qty', value: 1000 },
                  { key: 'list_unit_price', value: 1.5 },
                  { key: 'discounted_unit_price', value: 1500 },
                  { key: 'list_total_price', value: 1500 },
                  { key: 'discounting', value: 0 },
                  { key: 'discounted_total_price', value: 1500 },
                ],
              },
            ],
          },
          addons: {
            rows: [
              {
                addon_id: 1,
                name: 'A',
                values: [
                  { key: 'qty', value: 4 },
                  { key: 'list_unit_price', value: 5000 },
                  { key: 'discounted_unit_price', value: 4000 },
                  { key: 'list_total_price', value: 20000 },
                  { key: 'discounting', value: 20 },
                  { key: 'discounted_total_price', value: 16000 },
                ],
              },
              {
                addon_id: 2,
                name: 'B',
                values: [
                  { key: 'qty', value: 1 },
                  { key: 'list_unit_price', value: 20000 },
                  { key: 'discounted_unit_price', value: 18000 },
                  { key: 'list_total_price', value: 20000 },
                  { key: 'discounting', value: 10 },
                  { key: 'discounted_total_price', value: 18000 },
                ],
              },
            ],
          },
        },
      },
    ],
  },
];

export const columnsKeys = [
  { key: 'qty', value: null },
  { key: 'list_unit_price', value: null },
  { key: 'discounted_unit_price', value: null },
  { key: 'list_total_price', value: null },
  { key: 'discount', value: null },
  { key: 'discounted_total_price', value: null },
];
