
import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar productos con su categoría
router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        p.codigo,
        p.precio,
        p.stock,
        p.stock_minimo,
        p.activo,
        c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      ORDER BY p.id DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error al listar productos:', error);
        res.status(500).json({ message: 'Error al consultar productos' });
    }
});

// Registrar un producto
router.post('/', async (req, res) => {
    const {
        nombre,
        codigo,
        precio,
        stock,
        stock_minimo,
        categoria_id,
    } = req.body;

    if (
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        !Number.isFinite(Number(precio)) ||
        Number(precio) < 0 ||
        !Number.isInteger(Number(stock ?? 0)) ||
        Number(stock ?? 0) < 0
    ) {
        return res.status(400).json({
            message: 'Nombre, precio o stock no válidos',
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO productos
        (nombre, codigo, precio, stock, stock_minimo, categoria_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [
                nombre.trim(),
                codigo || null,
                Number(precio),
                Number(stock ?? 0),
                Number(stock_minimo ?? 5),
                categoria_id || null,
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al registrar producto:', error);
        return res.status(500).json({
            message: 'No se pudo registrar el producto. Comprueba que el código no esté duplicado.',
        });
    }
});

router.put('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, codigo, precio, stock, stock_minimo } = req.body;

    if (
        !Number.isInteger(id) ||
        id <= 0 ||
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        !Number.isFinite(Number(precio)) ||
        Number(precio) < 0 ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0 ||
        !Number.isInteger(Number(stock_minimo)) ||
        Number(stock_minimo) < 0
    ) {
        return res.status(400).json({ message: 'Datos no válidos' });
    }

    try {
        const result = await pool.query(
            `UPDATE productos
         SET nombre = $1,
             codigo = $2,
             precio = $3,
             stock = $4,
             stock_minimo = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
            [
                nombre.trim(),
                codigo || null,
                Number(precio),
                Number(stock),
                Number(stock_minimo),
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({
            message: 'No se pudo actualizar el producto. Comprueba que el código no esté duplicado.',
        });
    }
});


router.patch('/:id/deactivate', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'ID de producto no válido' });
    }

    try {
        const result = await pool.query(
            `UPDATE productos
         SET activo = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND activo = TRUE
         RETURNING id, nombre, activo`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado o ya está desactivado',
            });
        }

        return res.json({
            message: 'Producto desactivado correctamente',
            product: result.rows[0],
        });
    } catch (error) {
        console.error('Error al desactivar producto:', error);
        return res.status(500).json({
            message: 'No se pudo desactivar el producto',
        });
    }
});


export default router;
