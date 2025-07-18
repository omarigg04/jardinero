const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'jardinero_virtual'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
});

// Importar rutas
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const shopRoutes = require('./routes/shop');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/shop', shopRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ message: '🌱 Jardinero Virtual API funcionando correctamente', timestamp: new Date() });
});

// Hacer la conexión de DB disponible globalmente
app.locals.db = db;

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📱 API disponible en http://localhost:${PORT}/api`);
});

module.exports = app;