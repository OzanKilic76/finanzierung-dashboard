import React, { useEffect, useMemo, useState } from 'react'

const USERS = [
  { username: 'admin', password: 'finanzpilot', name: 'Sophie Wagner', role: 'Administrator' },
  { username: 'berater', password: 'beratung2026', name: 'Leon Hoffmann', role: 'Finanzberater' },
]

const CUSTOMERS = [
]

const STATUS_FILTERS = ['Alle', 'Beratungsgespräch geführt', 'Finanzierungsprozess gestartet', 'Finished']
const SENDER_EMAIL = 'kilic.ozan@outlook.de'
const SENDER_NAME = 'Ozan Kilic'

async function apiRequest(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Die Anfrage ist fehlgeschlagen.')
  return payload
}

function Icon({ name, size = 20 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.09A1.7 1.7 0 0 0 12.38 18a1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.42 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.86A1.7 1.7 0 0 0 9.42 11a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.42-1.42.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 13.41 6.5V6h2v.5A1.7 1.7 0 0 0 16.44 8a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 11c.19.58.73.97 1.34.97H21v2h-.26A1.7 1.7 0 0 0 19.4 15Z" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = (event) => {
    event.preventDefault()
    const user = USERS.find((item) => item.username === username && item.password === password)
    if (!user) {
      setError('Benutzername oder Passwort ist nicht korrekt.')
      return
    }
    onLogin(user)
  }
  return (
    <main className="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />
      <section className="login-card">
        <div className="brand brand-centered"><span className="brand-mark">K</span><span>Kilic <span className="brand-highlight">Baufinanzierung</span></span></div>
        <div className="login-intro"><p className="eyebrow">Willkommen zurück</p><h1>Schön, dass Sie wieder da sind.</h1><p>Melde dich an, um deine Kundenübersicht zu verwalten.</p></div>
        <form onSubmit={submit} className="login-form">
          <label>Benutzername<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="z. B. admin" autoComplete="username" /></label>
          <label>Passwort<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button login-button" type="submit">Anmelden <Icon name="arrow" size={18} /></button>
        </form>
        <p className="login-footer">© 2026 Kilic Baufinanzierung · Sicher und übersichtlich</p>
      </section>
    </main>
  )
}

function StatCard({ label, value, detail, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><span /></div><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></div>
}

function StatusBadge({ status }) {
  const className = status === 'Finished' ? 'success' : status === 'Beratungsgespräch geführt' ? 'neutral' : 'info'
  return <span className={`status-badge ${className}`}><i />{status}</span>
}

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

function Dashboard({ user, onLogout }) {
  const [customers, setCustomers] = useState([])
  const [referrers, setReferrers] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Alle')
  const [selected, setSelected] = useState(null)
  const [statusNotice, setStatusNotice] = useState(null)
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showReferrerAdmin, setShowReferrerAdmin] = useState(false)
  const [newPerson, setNewPerson] = useState({ name: '', city: '', email: '', referrer: '' })
  const [newReferrer, setNewReferrer] = useState({ name: '', email: '' })
  const [dataError, setDataError] = useState('')
  useEffect(() => {
    apiRequest('/api/bootstrap')
      .then((data) => {
        setCustomers(data.customers)
        setReferrers(data.referrers)
      })
      .catch((error) => {
        console.error(error)
        setDataError('Die zentrale Datenbank ist nicht erreichbar.')
      })
  }, [])
  const filteredCustomers = useMemo(() => customers.filter((customer) => {
    const matchesQuery = `${customer.name} ${customer.city} ${customer.type}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'Alle' || customer.status === filter
    return matchesQuery && matchesFilter
  }), [customers, filter, query])
  const consultationCount = customers.filter((customer) => customer.status === 'Beratungsgespräch geführt').length
  const startedCount = customers.filter((customer) => customer.status === 'Finanzierungsprozess gestartet').length
  const finishedCount = customers.filter((customer) => customer.status === 'Finished').length
  const updateStatus = async (status) => {
    try {
      const updatedCustomer = await apiRequest(`/api/customers/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setCustomers((current) => current.map((customer) => customer.id === updatedCustomer.id ? updatedCustomer : customer))
      setSelected(updatedCustomer)
    } catch (error) {
      console.error(error)
      setDataError(error.message)
      return
    }
    setStatusNotice({ customer: selected.name, referrer: selected.referrer, email: selected.referrerEmail, status })
  }
  const addPerson = async (event) => {
    event.preventDefault()
    const referrer = referrers.find((item) => String(item.id) === newPerson.referrer)
    if (!newPerson.name.trim() || !newPerson.referrer || !referrer) return
    try {
      const customer = await apiRequest('/api/customers', { method: 'POST', body: JSON.stringify({ ...newPerson, referrerId: Number(newPerson.referrer) }) })
      customer.accent = ['violet', 'blue', 'orange', 'green', 'pink'][customers.length % 5]
      setCustomers((current) => [...current, customer])
      setNewPerson({ name: '', city: '', email: '', referrer: '' })
      setShowAddPerson(false)
    } catch (error) {
      console.error(error)
      setDataError(error.message)
    }
  }
  const addReferrer = async (event) => {
    event.preventDefault()
    if (!newReferrer.name.trim() || !newReferrer.email.trim()) return
    if (referrers.some((item) => item.email.toLowerCase() === newReferrer.email.trim().toLowerCase())) return
    try {
      const referrer = await apiRequest('/api/referrers', { method: 'POST', body: JSON.stringify(newReferrer) })
      setReferrers((current) => [...current, referrer])
      setNewReferrer({ name: '', email: '' })
    } catch (error) {
      console.error(error)
      setDataError(error.message)
    }
  }
  return (
    <div className="app-shell">
      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Arbeitsbereich</span><Icon name="chevron" size={14} /><strong>Übersicht</strong></div><div className="topbar-actions"><button className="icon-button notification"><Icon name="bell" size={19} /><i /></button>{user.role === 'Administrator' && <button className="admin-button" onClick={() => setShowReferrerAdmin(true)}>Vermittler verwalten</button>}<div className="user-menu"><div className="avatar avatar-small">SW</div><div><strong>{user.name}</strong><small>{user.role}</small></div><button className="logout-button" onClick={onLogout}><Icon name="logout" size={16} /> Abmelden</button></div></div></header>
        <div className="content-wrap">
          <div className="page-heading"><div><p className="eyebrow">Sonntag, 01. November 2026</p><h1>Guten Morgen, {user.name.split(' ')[0]} <span className="wave">✦</span></h1><p>Hier ist der aktuelle Überblick über deine Kunden.</p></div><button className="primary-button" onClick={() => setShowAddPerson(true)}><Icon name="plus" size={18} /> Neue Person</button></div>
          {dataError && <div className="form-error data-error">{dataError}</div>}
          <section className="stats-grid"><StatCard label="Kunden gesamt" value={customers.length} detail="In deiner Übersicht" tone="violet" /><StatCard label="Beratungsgespräch geführt" value={consultationCount} detail="Nächster Schritt: Finanzierung" tone="blue" /><StatCard label="Finanzierungsprozess gestartet" value={startedCount} detail="Aktiv in Bearbeitung" tone="green" /><StatCard label="Finished" value={finishedCount} detail="Erfolgreich abgeschlossen" tone="orange" /></section>
          <section className="section-header"><div><h2>Kundenübersicht</h2><p>Sehe auf einen Blick, wo jeder Kunde aktuell steht.</p></div><button className="text-button">Alle anzeigen <Icon name="arrow" size={16} /></button></section>
          <div className="toolbar"><div className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Person suchen..." /></div><div className="filter-group">{STATUS_FILTERS.map((item) => <button key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
          <div className="table-card"><div className="table-head"><span>Person</span><span>Vermittler</span><span>Status</span><span>Zuletzt aktualisiert</span><span /></div>{filteredCustomers.map((customer) => <button className="table-row simplified-row" key={customer.id} onClick={() => setSelected(customer)}><div className="person-cell"><div className={`avatar avatar-${customer.accent}`}>{customer.initials}</div><div><strong>{customer.name}</strong><small>{customer.city}</small></div></div><div className="referrer-cell"><strong>{customer.referrer}</strong><small>Empfehlung</small></div><StatusBadge status={customer.status} /><small className="updated-cell">{customer.updated}</small><Icon name="chevron" size={17} /></button>)}{filteredCustomers.length === 0 && <div className="empty-state">Keine Personen für diese Suche gefunden.</div>}</div>
          <p className="table-footer">Zuletzt synchronisiert vor 2 Minuten · <span>Alle Daten sind aktuell</span></p>
        </div>
      </main>
      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="detail-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className={`detail-banner banner-${selected.accent}`}><div className={`avatar avatar-${selected.accent}`}>{selected.initials}</div><div><p>Kundenstatus</p><h2>{selected.name}</h2><span>{selected.email}</span></div></div><div className="detail-summary single-summary"><div><small>Vermittler</small><strong>{selected.referrer}</strong><a href={`mailto:${selected.referrerEmail}`}>{selected.referrerEmail}</a></div><div><small>Aktueller Stand</small><strong>{selected.status}</strong></div></div>{user.role === 'Administrator' && <label className="status-editor">Status ändern<select value={selected.status} onChange={(event) => updateStatus(event.target.value)}>{STATUS_FILTERS.slice(1).map((status) => <option key={status} value={status}>{status}</option>)}</select></label>}<h3>Status des Kunden</h3><div className="step-list"><div className={`step ${selected.status === 'Beratungsgespräch geführt' || selected.status === 'Finanzierungsprozess gestartet' || selected.status === 'Finished' ? 'done' : ''}`}><span>1</span><div><strong>Beratungsgespräch geführt</strong><small>{selected.status === 'Beratungsgespräch geführt' ? 'Aktueller Stand' : 'Erledigt'}</small></div></div><div className={`step ${selected.status === 'Finanzierungsprozess gestartet' || selected.status === 'Finished' ? 'done' : ''}`}><span>2</span><div><strong>Finanzierungsprozess gestartet</strong><small>{selected.status === 'Finanzierungsprozess gestartet' ? 'Aktueller Stand' : selected.status === 'Finished' ? 'Erledigt' : 'Ausstehend'}</small></div></div><div className={`step ${selected.status === 'Finished' ? 'done' : ''}`}><span>3</span><div><strong>Finished</strong><small>{selected.status === 'Finished' ? 'Aktueller Stand' : 'Ausstehend'}</small></div></div></div></section></div>}
      {showAddPerson && <div className="modal-backdrop" onClick={() => setShowAddPerson(false)}><section className="detail-modal add-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowAddPerson(false)}>×</button><p className="eyebrow">Kundenübersicht</p><h2>Neue Person hinzufügen</h2><p className="modal-description">Ordne die Person direkt einem bestehenden Vermittler zu.</p><form className="add-person-form" onSubmit={addPerson}><label>Name *<input required value={newPerson.name} onChange={(event) => setNewPerson({ ...newPerson, name: event.target.value })} placeholder="z. B. Max Mustermann" /></label><label>Ort<input value={newPerson.city} onChange={(event) => setNewPerson({ ...newPerson, city: event.target.value })} placeholder="z. B. Berlin" /></label><label>E-Mail<input type="email" value={newPerson.email} onChange={(event) => setNewPerson({ ...newPerson, email: event.target.value })} placeholder="max@example.de" /></label><label>Vermittler *<select required value={newPerson.referrer} onChange={(event) => setNewPerson({ ...newPerson, referrer: event.target.value })}><option value="">Vermittler auswählen</option>{referrers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.email}</option>)}</select></label><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowAddPerson(false)}>Abbrechen</button><button type="submit" className="primary-button">Person hinzufügen</button></div></form></section></div>}
      {showReferrerAdmin && <div className="modal-backdrop" onClick={() => setShowReferrerAdmin(false)}><section className="detail-modal add-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowReferrerAdmin(false)}>×</button><p className="eyebrow">Administrator</p><h2>Vermittler verwalten</h2><p className="modal-description">Neue Vermittler stehen anschließend bei jeder neuen Person zur Auswahl.</p><div className="referrer-list">{referrers.map((item) => <div className="referrer-item" key={item.email}><div className="avatar avatar-small">{getInitials(item.name)}</div><div><strong>{item.name}</strong><small>{item.email}</small></div></div>)}</div><form className="add-person-form" onSubmit={addReferrer}><label>Name *<input required value={newReferrer.name} onChange={(event) => setNewReferrer({ ...newReferrer, name: event.target.value })} placeholder="z. B. Laura Becker" /></label><label>E-Mail-Adresse *<input required type="email" value={newReferrer.email} onChange={(event) => setNewReferrer({ ...newReferrer, email: event.target.value })} placeholder="laura@example.de" /></label><div className="form-actions"><button type="submit" className="primary-button"><Icon name="plus" size={16} /> Vermittler hinzufügen</button></div></form></section></div>}
      {statusNotice && <div className="status-notice"><div><strong>Status aktualisiert</strong><span>{statusNotice.customer} steht jetzt auf „{statusNotice.status}“.</span></div><a href={`mailto:${statusNotice.email}?subject=Status-Update%20zu%20${encodeURIComponent(statusNotice.customer)}&body=${encodeURIComponent(`Der Status von ${statusNotice.customer} wurde auf "${statusNotice.status}" geändert.\n\nViele Grüße,\n${SENDER_NAME}\n${SENDER_EMAIL}`)}`}>E-Mail an {statusNotice.referrer} öffnen</a><button onClick={() => setStatusNotice(null)}>×</button></div>}
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  return user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />
}
