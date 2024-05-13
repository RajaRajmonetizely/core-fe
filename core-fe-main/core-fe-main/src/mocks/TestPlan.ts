const plans = [
  {
    id: 'plan1',
    name: 'Test',
    description: 'Test',
    version: '2.3',
    productId: 'test1',
    repositoryId: '2',
    details: {
      t1: {
        name: 'pro',
        messagingChannel: {
          defaultAddon: [
            {
              id: '1234',
              name: 'SMS',
            },
          ],
          additionalAddon: [
            {
              id: '567',
              name: 'EMAIL',
            },
          ],
        },
        Sales: {
          defaultAddon: [
            {
              id: '1234',
              name: 'SMS',
            },
          ],
          additionalAddon: [
            {
              id: '342',
              name: 'Lead Management',
            },
          ],
        },
      },
      t2: {
        name: 'elite',
        messagingChannel: {
          defaultAddon: [
            {
              id: '1234',
              name: 'SMS',
            },
          ],
          additionalAddon: [
            {
              id: '090',
              name: 'WHATSAPP',
            },
          ],
        },
        Sales: {
          defaultAddon: [
            {
              id: '1234',
              name: 'SMS',
            },
          ],
          additionalAddon: [
            {
              id: '64',
              name: 'Contact Management',
            },
          ],
        },
      },
    },
  },
];

export default plans;
