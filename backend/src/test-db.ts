
import { pool } from './db.js';

async function testConnection() {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database, NOW() AS time'
    );

    console.log('Conexión exitosa:', result.rows[0]);
  } catch (error) {
    console.error('Error de conexión:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();
