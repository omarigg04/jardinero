const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const db = req.app.locals.db;

    try {
        // Verificar si el usuario ya existe
        const checkUser = 'SELECT id FROM users WHERE username = ? OR email = ?';
        db.query(checkUser, [username, email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error en la base de datos' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Usuario o email ya existe' });
            }

            // Hash de la contraseña
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Crear usuario usando el procedimiento almacenado
            const createUser = 'CALL InitializeNewUser(?, ?, ?)';
            db.query(createUser, [username, email, passwordHash], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Error creando el usuario' });
                }

                const userId = results[0][0].new_user_id;

                // Crear token JWT
                const token = jwt.sign(
                    { userId, username },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: 'Usuario creado exitosamente',
                    token,
                    user: { id: userId, username, email }
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Login de usuario
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = req.app.locals.db;

    const query = 'SELECT id, username, email, password_hash FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];

        try {
            const validPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!validPassword) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }

            // Crear token JWT
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login exitoso',
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        } catch (error) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
});

module.exports = router;