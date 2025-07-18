const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Obtener estado completo del juego del usuario
router.get('/state', authenticateToken, (req, res) => {
    console.log('🎮 Obteniendo estado del juego para usuario:', req.user.userId);
    const userId = req.user.userId;
    const db = req.app.locals.db;

    // Consulta compleja para obtener todo el estado del juego
    const query = `
        SELECT 
            u.id,
            u.username,
            u.money,
            u.experience,
            u.level,
            -- Inventario de semillas
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'seed_type_id', ui.seed_type_id,
                    'name', st.name,
                    'quantity', ui.quantity,
                    'emoji', st.emoji,
                    'buy_price', st.buy_price,
                    'sell_price', st.sell_price
                )
            ) FROM user_inventory ui 
            JOIN seed_types st ON ui.seed_type_id = st.id 
            WHERE ui.user_id = u.id) as seed_inventory,
            -- Inventario de frutos
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'seed_type_id', uf.seed_type_id,
                    'name', st.name,
                    'quantity', uf.quantity,
                    'emoji', st.emoji,
                    'sell_price', st.fruit_sell_price
                )
            ) FROM user_fruits uf 
            JOIN seed_types st ON uf.seed_type_id = st.id 
            WHERE uf.user_id = u.id) as fruit_inventory,
            -- Estado del terreno con cálculo de progreso
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'position', up.plot_position,
                    'seed_type_id', up.seed_type_id,
                    'seed_name', st.name,
                    'emoji', st.emoji,
                    'color', st.color,
                    'planted_at', up.planted_at,
                    'growth_time_hours', st.growth_time_hours,
                    'is_ready', up.is_ready_to_harvest,
                    'progress', CASE 
                        WHEN up.seed_type_id IS NOT NULL THEN 
                            GetPlantGrowthProgress(up.planted_at, st.growth_time_hours)
                        ELSE NULL 
                    END
                )
            ) FROM user_plots up 
            LEFT JOIN seed_types st ON up.seed_type_id = st.id 
            WHERE up.user_id = u.id 
            ORDER BY up.plot_position) as plots
        FROM users u
        WHERE u.id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error obteniendo estado del juego:', err);
            return res.status(500).json({ error: 'Error obteniendo estado del juego' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const gameState = results[0];
        
        // Parsear JSON strings (verificar si ya son objetos)
        gameState.seed_inventory = typeof gameState.seed_inventory === 'string' 
            ? JSON.parse(gameState.seed_inventory || '[]') 
            : gameState.seed_inventory || [];
        gameState.fruit_inventory = typeof gameState.fruit_inventory === 'string' 
            ? JSON.parse(gameState.fruit_inventory || '[]') 
            : gameState.fruit_inventory || [];
        gameState.plots = typeof gameState.plots === 'string' 
            ? JSON.parse(gameState.plots || '[]') 
            : gameState.plots || [];

        res.json(gameState);
    });
});

// Plantar una semilla
router.post('/plant', authenticateToken, (req, res) => {
    const { plotPosition, seedTypeId } = req.body;
    const userId = req.user.userId;
    const db = req.app.locals.db;

    // Verificar que el usuario tiene la semilla
    const checkSeed = 'SELECT quantity FROM user_inventory WHERE user_id = ? AND seed_type_id = ?';
    db.query(checkSeed, [userId, seedTypeId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando inventario' });
        }

        if (results.length === 0 || results[0].quantity < 1) {
            return res.status(400).json({ error: 'No tienes esa semilla en tu inventario' });
        }

        // Verificar que la parcela está vacía
        const checkPlot = 'SELECT seed_type_id FROM user_plots WHERE user_id = ? AND plot_position = ?';
        db.query(checkPlot, [userId, plotPosition], (err, plotResults) => {
            if (err) {
                return res.status(500).json({ error: 'Error verificando parcela' });
            }

            if (plotResults.length === 0) {
                return res.status(400).json({ error: 'Parcela no válida' });
            }

            if (plotResults[0].seed_type_id !== null) {
                return res.status(400).json({ error: 'La parcela ya está ocupada' });
            }

            // Comenzar transacción
            db.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error iniciando transacción' });
                }

                // Reducir inventario de semillas
                const updateInventory = 'UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND seed_type_id = ?';
                db.query(updateInventory, [userId, seedTypeId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error actualizando inventario' });
                        });
                    }

                    // Plantar la semilla
                    const plantSeed = 'UPDATE user_plots SET seed_type_id = ?, planted_at = NOW(), is_ready_to_harvest = FALSE WHERE user_id = ? AND plot_position = ?';
                    db.query(plantSeed, [seedTypeId, userId, plotPosition], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error plantando semilla' });
                            });
                        }

                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error confirmando transacción' });
                                });
                            }

                            res.json({ message: 'Semilla plantada exitosamente' });
                        });
                    });
                });
            });
        });
    });
});

// Cosechar una planta
router.post('/harvest', authenticateToken, (req, res) => {
    const { plotPosition } = req.body;
    const userId = req.user.userId;
    const db = req.app.locals.db;

    // Usar el procedimiento almacenado para cosechar
    const harvestQuery = 'CALL HarvestPlant(?, ?)';
    db.query(harvestQuery, [userId, plotPosition], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error cosechando planta' });
        }

        const result = results[0][0];
        if (result.result === 'success') {
            res.json({ 
                message: 'Planta cosechada exitosamente', 
                experienceGained: result.experience_gained 
            });
        } else {
            res.status(400).json({ error: result.message });
        }
    });
});

// Actualizar estado de plantas (verificar si están listas para cosechar)
router.post('/update-plants', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const db = req.app.locals.db;

    const updateQuery = `
        UPDATE user_plots up
        JOIN seed_types st ON up.seed_type_id = st.id
        SET up.is_ready_to_harvest = TRUE
        WHERE up.user_id = ? 
        AND up.seed_type_id IS NOT NULL 
        AND up.is_ready_to_harvest = FALSE
        AND GetPlantGrowthProgress(up.planted_at, st.growth_time_hours) >= 100
    `;

    db.query(updateQuery, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error actualizando plantas' });
        }

        res.json({ 
            message: 'Estado de plantas actualizado', 
            plantsReady: results.affectedRows 
        });
    });
});

module.exports = router;