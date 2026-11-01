import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth'
import outputs from '../amplify_outputs.json'

export const cloudEnabled = Boolean(outputs?.data && outputs?.auth)

if (cloudEnabled) Amplify.configure(outputs)

const client = cloudEnabled ? generateClient() : null
const statusToCloud = {
  Neu: 'NEU',
  'Beratungsgespräch geführt': 'BERATUNGSGESPRAECH_GEFUEHRT',
  'Finanzierungsprozess gestartet': 'FINANZIERUNGSPROZESS_GESTARTET',
  Finished: 'FINISHED',
}
const statusFromCloud = Object.fromEntries(Object.entries(statusToCloud).map(([label, value]) => [value, label]))

function responseData(response) {
  if (response.errors?.length) throw new Error(response.errors.map((error) => error.message).join('; '))
  return response.data
}

function mapReferrer(referrer) {
  return { id: referrer.id, name: referrer.name, email: referrer.email }
}

function mapCustomer(customer, referrerMap) {
  const referrer = referrerMap.get(customer.referrerId)
  return {
    ...customer,
    status: statusFromCloud[customer.status] || customer.status,
    referrer: referrer?.name || 'Unbekannt',
    referrerEmail: referrer?.email || '',
    referrerId: customer.referrerId,
  }
}

export async function cloudSignIn(username, password) {
  const result = await signIn({ username, password })
  if (!result.isSignedIn) {
    throw new Error('Die Anmeldung ist noch nicht abgeschlossen. Verwende einen permanenten Cognito-Login oder schließe die angeforderte Passwortänderung ab.')
  }
  return { name: 'Ozan Kilic', role: 'Administrator' }
}

export async function cloudSignOut() {
  await signOut()
}

export async function cloudCurrentUser() {
  await getCurrentUser()
  return { name: 'Ozan Kilic', role: 'Administrator' }
}

export async function cloudBootstrap() {
  const [referrerResponse, customerResponse] = await Promise.all([
    client.models.Referrer.list(),
    client.models.Customer.list(),
  ])
  const referrers = responseData(referrerResponse)
  const customers = responseData(customerResponse)
  const mappedReferrers = referrers.map(mapReferrer)
  const referrerMap = new Map(mappedReferrers.map((referrer) => [referrer.id, referrer]))
  return { referrers: mappedReferrers, customers: customers.map((customer) => mapCustomer(customer, referrerMap)) }
}

export async function cloudCreateReferrer(input) {
  const data = responseData(await client.models.Referrer.create({ name: input.name.trim(), email: input.email?.trim() || undefined }))
  return mapReferrer(data)
}

export async function cloudCreateCustomer(input) {
  const data = responseData(await client.models.Customer.create({
    name: input.name.trim(),
    initials: input.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join(''),
    city: input.city?.trim() || 'Nicht angegeben',
    email: input.email?.trim() || 'Keine E-Mail hinterlegt',
    referrerId: input.referrerId,
    status: statusToCloud['Beratungsgespräch geführt'],
    updated: 'Gerade eben',
  }))
  const referrer = responseData(await client.models.Referrer.get({ id: input.referrerId }))
  return mapCustomer(data, new Map([[referrer.id, mapReferrer(referrer)]]))
}

export async function cloudUpdateCustomerStatus(id, status) {
  const data = responseData(await client.models.Customer.update({ id, status: statusToCloud[status], updated: 'Gerade eben' }))
  const referrer = responseData(await client.models.Referrer.get({ id: data.referrerId }))
  return mapCustomer(data, new Map([[referrer.id, mapReferrer(referrer)]]))
}
