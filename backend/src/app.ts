
import express from 'express';
import cors from 'cors';
import productsRouter from './products.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'API de inventario funcionando' });
});

app.use('/api/products', productsRouter);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`Servidor listo en http://localhost:${port}`);
});
