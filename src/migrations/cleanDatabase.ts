import { createConnection } from '../utils/dbconnect'

const cleanDatabase = async () => {
   const client = await createConnection()
   try {
      await client.query('DROP TABLE IF EXISTS channels CASCADE')
      await client.query('DROP TABLE IF EXISTS events CASCADE')
      await client.query('DROP TABLE IF EXISTS event_types CASCADE')
      await client.query('DROP TABLE IF EXISTS channel_categories CASCADE')
      await client.query('DROP TABLE IF EXISTS otps CASCADE')
      await client.query('DROP TABLE IF EXISTS users CASCADE')
      await client.query('DROP TABLE IF EXISTS rsvps CASCADE')
      await client.query('DROP TABLE IF EXISTS messages CASCADE')
      await client.query('DROP TABLE IF EXISTS guests CASCADE')
      await client.query('DROP TABLE IF EXISTS direct_messages CASCADE')
      await client.query('DROP TABLE IF EXISTS conversations CASCADE')
      await client.query('DROP TABLE IF EXISTS vendors CASCADE')
      await client.query('DROP TABLE IF EXISTS service_types CASCADE')
      await client.query('DROP TABLE IF EXISTS prices CASCADE')
      await client.query('DROP TABLE IF EXISTS services CASCADE')
   } catch (error) {
      console.error('Error creating tables:', error)
      throw error
   }
}

export default cleanDatabase
