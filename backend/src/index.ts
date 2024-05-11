import bodyParser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import cookieSession from 'cookie-session'
import http from 'http'
import router from './routes'
import passport from './services/passport'
import { pool } from './utils/dbconnect'
import createUsersTable from './migrations/create_users_table'
import createVenuesTable from './migrations/create_venues_table'
import createEventsTable from './migrations/create_events_table'
import createRSVPsTable from './migrations/create_rsvp_table'
import createEventParticipantsTable from './migrations/create_event_participants_table'

dotenv.config()
const PORT = process.env.PORT

const app = express()

app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   }),
)

app.use(compression())
app.use(cookieParser())
app.use(bodyParser.json())

app.use(
   cookieSession({
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secret: process.env.SESSION_SECRET,
   }),
)

app.use(passport.initialize())
app.use(passport.session())

const server = http.createServer(app)

server.listen(PORT, () => {
   console.log(`Server listening on port ${PORT}`)
})

;(async () => {
   try {
      await createUsersTable()
      await createVenuesTable()
      await createEventsTable()
      await createRSVPsTable()
      await createEventParticipantsTable()
   } catch (error) {
      console.error('Error running migration:', error)
      process.exit(1)
   }
})()
pool.getConnection().then((conn) => {
   console.log('Connected to the database')
   conn.release()
})

app.use('/', router())