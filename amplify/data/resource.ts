import { a, defineData, type ClientSchema } from '@aws-amplify/backend'

const schema = a.schema({
  Status: a.enum([
    'NEU',
    'BERATUNGSGESPRAECH_GEFUEHRT',
    'FINANZIERUNGSPROZESS_GESTARTET',
    'FINISHED',
  ]),
  Referrer: a.model({
    name: a.string().required(),
    email: a.string(),
    customers: a.hasMany('Customer', 'referrerId'),
  }).authorization((allow) => [allow.authenticated()]),
  Customer: a.model({
    name: a.string().required(),
    initials: a.string().required(),
    city: a.string().required(),
    email: a.string().required(),
    status: a.ref('Status').required(),
    updated: a.string().required(),
    referrerId: a.id().required(),
    referrer: a.belongsTo('Referrer', 'referrerId'),
  }).authorization((allow) => [allow.authenticated()]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
