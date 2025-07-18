const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Obtener información de la tienda (tipos de semillas disponibles)
router.get('/seeds', authenticateToken, (req, res) => {
    const db = req.app.locals.db;

    const query = 'SELECT id, name, growth_time_hours, buy_price, sell_price, fruit_sell_price, emoji, color FROM seed_types ORDER BY buy_price';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo información de semillas' });
        }

        res.json(results);
    });
});

// Comprar semillas
router.post('/buy-seeds', authenticateToken, (req, res) => {
    const { seedTypeId, quantity } = req.body;
    const userId = req.user.userId;
    const db = req.app.locals.db;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    // Obtener precio de la semilla
    const getPriceQuery = 'SELECT buy_price, name FROM seed_types WHERE id = ?';
    db.query(getPriceQuery, [seedTypeId], (err, priceResults) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo precio' });
        }

        if (priceResults.length === 0) {
            return res.status(404).json({ error: 'Tipo de semilla no encontrado' });
        }

        const seedPrice = priceResults[0].buy_price;
        const seedName = priceResults[0].name;
        const totalCost = seedPrice * quantity;

        // Verificar que el usuario tiene suficiente dinero
        const checkMoneyQuery = 'SELECT money FROM users WHERE id = ?';
        db.query(checkMoneyQuery, [userId], (err, moneyResults) => {
            if (err) {
                return res.status(500).json({ error: 'Error verificando dinero' });
            }

            const userMoney = moneyResults[0].money;
            if (userMoney < totalCost) {
                return res.status(400).json({ error: 'No tienes suficiente dinero' });
            }

            // Comenzar transacción
            db.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error iniciando transacción' });
                }

                // Reducir dinero del usuario
                const updateMoneyQuery = 'UPDATE users SET money = money - ? WHERE id = ?';
                db.query(updateMoneyQuery, [totalCost, userId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error actualizando dinero' });
                        });
                    }

                    // Agregar semillas al inventario
                    const updateInventoryQuery = `
                        INSERT INTO user_inventory (user_id, seed_type_id, quantity) 
                        VALUES (?, ?, ?) 
                        ON DUPLICATE KEY UPDATE quantity = quantity + ?
                    `;
                    db.query(updateInventoryQuery, [userId, seedTypeId, quantity, quantity], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error actualizando inventario' });
                            });
                        }

                        // Registrar transacción
                        const transactionQuery = `
                            INSERT INTO transactions (user_id, transaction_type, seed_type_id, quantity, unit_price, total_amount)
                            VALUES (?, 'buy_seed', ?, ?, ?, ?)
                        `;
                        db.query(transactionQuery, [userId, seedTypeId, quantity, seedPrice, totalCost], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error registrando transacción' });
                                });
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Error confirmando transacción' });
                                    });
                                }

                                res.json({ 
                                    message: `Compraste ${quantity} semillas de ${seedName}`,
                                    totalCost,
                                    newBalance: userMoney - totalCost
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Vender semillas
router.post('/sell-seeds', authenticateToken, (req, res) => {
    const { seedTypeId, quantity } = req.body;
    const userId = req.user.userId;
    const db = req.app.locals.db;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    // Verificar que el usuario tiene suficientes semillas
    const checkInventoryQuery = 'SELECT quantity FROM user_inventory WHERE user_id = ? AND seed_type_id = ?';
    db.query(checkInventoryQuery, [userId, seedTypeId], (err, inventoryResults) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando inventario' });
        }

        if (inventoryResults.length === 0 || inventoryResults[0].quantity < quantity) {
            return res.status(400).json({ error: 'No tienes suficientes semillas' });
        }

        // Obtener precio de venta
        const getPriceQuery = 'SELECT sell_price, name FROM seed_types WHERE id = ?';
        db.query(getPriceQuery, [seedTypeId], (err, priceResults) => {
            if (err) {
                return res.status(500).json({ error: 'Error obteniendo precio' });
            }

            const sellPrice = priceResults[0].sell_price;
            const seedName = priceResults[0].name;
            const totalEarnings = sellPrice * quantity;

            // Comenzar transacción
            db.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error iniciando transacción' });
                }

                // Reducir semillas del inventario
                const updateInventoryQuery = 'UPDATE user_inventory SET quantity = quantity - ? WHERE user_id = ? AND seed_type_id = ?';
                db.query(updateInventoryQuery, [quantity, userId, seedTypeId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error actualizando inventario' });
                        });
                    }

                    // Agregar dinero al usuario
                    const updateMoneyQuery = 'UPDATE users SET money = money + ? WHERE id = ?';
                    db.query(updateMoneyQuery, [totalEarnings, userId], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error actualizando dinero' });
                            });
                        }

                        // Registrar transacción
                        const transactionQuery = `
                            INSERT INTO transactions (user_id, transaction_type, seed_type_id, quantity, unit_price, total_amount)
                            VALUES (?, 'sell_seed', ?, ?, ?, ?)
                        `;
                        db.query(transactionQuery, [userId, seedTypeId, quantity, sellPrice, totalEarnings], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error registrando transacción' });
                                });
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Error confirmando transacción' });
                                    });
                                }

                                res.json({ 
                                    message: `Vendiste ${quantity} semillas de ${seedName}`,
                                    totalEarnings
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Vender frutos
router.post('/sell-fruits', authenticateToken, (req, res) => {
    const { seedTypeId, quantity } = req.body;
    const userId = req.user.userId;
    const db = req.app.locals.db;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    // Verificar que el usuario tiene suficientes frutos
    const checkFruitsQuery = 'SELECT quantity FROM user_fruits WHERE user_id = ? AND seed_type_id = ?';
    db.query(checkFruitsQuery, [userId, seedTypeId], (err, fruitsResults) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando frutos' });
        }

        if (fruitsResults.length === 0 || fruitsResults[0].quantity < quantity) {
            return res.status(400).json({ error: 'No tienes suficientes frutos' });
        }

        // Obtener precio de venta de frutos
        const getPriceQuery = 'SELECT fruit_sell_price, name FROM seed_types WHERE id = ?';
        db.query(getPriceQuery, [seedTypeId], (err, priceResults) => {
            if (err) {
                return res.status(500).json({ error: 'Error obteniendo precio' });
            }

            const fruitPrice = priceResults[0].fruit_sell_price;
            const seedName = priceResults[0].name;
            const totalEarnings = fruitPrice * quantity;

            // Comenzar transacción
            db.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error iniciando transacción' });
                }

                // Reducir frutos del inventario
                const updateFruitsQuery = 'UPDATE user_fruits SET quantity = quantity - ? WHERE user_id = ? AND seed_type_id = ?';
                db.query(updateFruitsQuery, [quantity, userId, seedTypeId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error actualizando frutos' });
                        });
                    }

                    // Agregar dinero al usuario
                    const updateMoneyQuery = 'UPDATE users SET money = money + ? WHERE id = ?';
                    db.query(updateMoneyQuery, [totalEarnings, userId], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error actualizando dinero' });
                            });
                        }

                        // Registrar transacción
                        const transactionQuery = `
                            INSERT INTO transactions (user_id, transaction_type, seed_type_id, quantity, unit_price, total_amount)
                            VALUES (?, 'sell_fruit', ?, ?, ?, ?)
                        `;
                        db.query(transactionQuery, [userId, seedTypeId, quantity, fruitPrice, totalEarnings], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error registrando transacción' });
                                });
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Error confirmando transacción' });
                                    });
                                }

                                res.json({ 
                                    message: `Vendiste ${quantity} frutos de ${seedName}`,
                                    totalEarnings
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;