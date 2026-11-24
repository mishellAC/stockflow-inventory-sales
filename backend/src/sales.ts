
import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Consultar las ventas registradas
router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        v.id,
        v.fecha,
        v.total
      FROM ventas v
      ORDER BY v.fecha DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar ventas:', error);
        res.status(500).json({ message: 'Error al consultar las ventas' });
    }
});

export default router;
