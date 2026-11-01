import { createServer } from 'node:http'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dataDirectory = join(root, 'data')
mkdirSync(dataDirectory, { recursive: true })

const database = new DatabaseSync(join(dataDirectory, 'finanzierung.db'))
database.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS referrers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    initials TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    referrer_id INTEGER NOT NULL REFERENCES referrers(id),
    status TEXT NOT NULL,
    updated TEXT NOT NULL
  );
`)

const allowedStatuses = new Set(['Beratungsgespräch geführt', 'Finanzierungsprozess gestartet', 'Finished'])

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
  response.end(JSON.stringify(payload))
}

function getCustomer(id) {
  return database.prepare(`
    SELECT customers.id, customers.name, customers.initials, customers.city, customers.email,
      customers.status, customers.updated, referrers.name AS referrer, referrers.email AS referrerEmail,
      referrers.id AS referrerId
    FROM customers JOIN referrers ON referrers.id = customers.referrer_id
    WHERE customers.id = ?
  `).get(id)
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) } catch (error) { reject(error) }
    })
    request.on('error', reject)
  })
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' })
    response.end()
    return
  }

  const url = new URL(request.url, 'http://localhost')
  try {
    if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
      const referrers = database.prepare('SELECT id, name, email FROM referrers ORDER BY name').all()
      const customers = database.prepare(`
        SELECT customers.id, customers.name, customers.initials, customers.city, customers.email,
          customers.status, customers.updated, referrers.name AS referrer,
          referrers.email AS referrerEmail, referrers.id AS referrerId
        FROM customers JOIN referrers ON referrers.id = customers.referrer_id
        ORDER BY customers.id
      `).all()
      sendJson(response, 200, { customers, referrers })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/referrers') {
      const body = await parseBody(request)
      if (!body.name?.trim() || !body.email?.trim()) {
        sendJson(response, 400, { error: 'Name und E-Mail-Adresse sind erforderlich.' })
        return
      }
      const result = database.prepare('INSERT INTO referrers (name, email) VALUES (?, ?)').run(body.name.trim(), body.email.trim())
      sendJson(response, 201, { id: Number(result.lastInsertRowid), name: body.name.trim(), email: body.email.trim() })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/customers') {
      const body = await parseBody(request)
      const referrer = database.prepare('SELECT id, name, email FROM referrers WHERE id = ?').get(body.referrerId)
      if (!body.name?.trim() || !referrer) {
        sendJson(response, 400, { error: 'Name und Vermittler sind erforderlich.' })
        return
      }
      const initials = body.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
      const result = database.prepare(`
        INSERT INTO customers (name, initials, city, email, referrer_id, status, updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(body.name.trim(), initials, body.city?.trim() || 'Nicht angegeben', body.email?.trim() || 'Keine E-Mail hinterlegt', referrer.id, 'Beratungsgespräch geführt', 'Gerade eben')
      sendJson(response, 201, getCustomer(Number(result.lastInsertRowid)))
      return
    }

    const customerMatch = url.pathname.match(/^\/api\/customers\/(\d+)$/)
    if (request.method === 'PATCH' && customerMatch) {
      const body = await parseBody(request)
      if (!allowedStatuses.has(body.status)) {
        sendJson(response, 400, { error: 'Ungültiger Status.' })
        return
      }
      database.prepare('UPDATE customers SET status = ?, updated = ? WHERE id = ?').run(body.status, 'Gerade eben', Number(customerMatch[1]))
      sendJson(response, 200, getCustomer(Number(customerMatch[1])))
      return
    }

    sendJson(response, 404, { error: 'Route nicht gefunden.' })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      sendJson(response, 409, { error: 'Diese E-Mail-Adresse ist bereits als Vermittler angelegt.' })
      return
    }
    console.error(error)
    sendJson(response, 500, { error: 'Serverfehler.' })
  }
})

const port = Number(process.env.PORT || 3001)
server.listen(port, '0.0.0.0', () => {
  console.log(`SQLite API läuft auf http://localhost:${port}`)
})
