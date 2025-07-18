-- Base de datos para Jardinero Virtual
-- Estructura completa de tablas para el juego de simulación de jardinería

CREATE DATABASE IF NOT EXISTS jardinero_virtual;
USE jardinero_virtual;

-- Tabla de usuarios/jugadores
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    money DECIMAL(10,2) DEFAULT 100.00, -- Dinero inicial: 100
    experience INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de tipos de semillas
CREATE TABLE seed_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    growth_time_hours INT NOT NULL, -- Tiempo de crecimiento en horas
    buy_price DECIMAL(8,2) NOT NULL,
    sell_price DECIMAL(8,2) NOT NULL,
    fruit_sell_price DECIMAL(8,2) NOT NULL,
    experience_reward INT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    color VARCHAR(20) NOT NULL
);

-- Insertar los 4 tipos de semillas iniciales
INSERT INTO seed_types (name, growth_time_hours, buy_price, sell_price, fruit_sell_price, experience_reward, emoji, color) VALUES
('Tomate', 24, 10.00, 2.00, 25.00, 10, '🍅', '#ff4444'),
('Zanahoria', 48, 15.00, 3.00, 35.00, 20, '🥕', '#ff8800'),
('Lechuga', 12, 8.00, 1.50, 18.00, 5, '🥬', '#44ff44'),
('Calabaza', 72, 25.00, 5.00, 60.00, 35, '🎃', '#ff9900');

-- Tabla de inventario de semillas del usuario
CREATE TABLE user_inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    seed_type_id INT NOT NULL,
    quantity INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seed_type_id) REFERENCES seed_types(id),
    UNIQUE KEY unique_user_seed (user_id, seed_type_id)
);

-- Tabla de inventario de frutos del usuario
CREATE TABLE user_fruits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    seed_type_id INT NOT NULL,
    quantity INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seed_type_id) REFERENCES seed_types(id),
    UNIQUE KEY unique_user_fruit (user_id, seed_type_id)
);

-- Tabla del terreno (2x4 = 8 parcelas por usuario)
CREATE TABLE user_plots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plot_position INT NOT NULL, -- Posición 0-7 (2x4)
    seed_type_id INT NULL, -- NULL si está vacía
    planted_at TIMESTAMP NULL, -- Momento de plantación
    is_ready_to_harvest BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seed_type_id) REFERENCES seed_types(id),
    UNIQUE KEY unique_user_plot (user_id, plot_position)
);

-- Tabla de transacciones (historial de compras/ventas)
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    transaction_type ENUM('buy_seed', 'sell_seed', 'sell_fruit') NOT NULL,
    seed_type_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seed_type_id) REFERENCES seed_types(id)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_user_plots_user ON user_plots(user_id);
CREATE INDEX idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_user_fruits_user ON user_fruits(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);

-- Vista para obtener el estado completo del juego de un usuario
CREATE VIEW user_game_state AS
SELECT 
    u.id as user_id,
    u.username,
    u.money,
    u.experience,
    u.level,
    COUNT(up.id) as total_plots,
    COUNT(CASE WHEN up.seed_type_id IS NOT NULL THEN 1 END) as planted_plots,
    COUNT(CASE WHEN up.is_ready_to_harvest = TRUE THEN 1 END) as ready_to_harvest
FROM users u
LEFT JOIN user_plots up ON u.id = up.user_id
GROUP BY u.id, u.username, u.money, u.experience, u.level;

-- Procedimiento para inicializar un nuevo usuario
DELIMITER //
CREATE PROCEDURE InitializeNewUser(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    DECLARE user_id INT;
    DECLARE i INT DEFAULT 0;
    
    -- Insertar el usuario
    INSERT INTO users (username, email, password_hash) 
    VALUES (p_username, p_email, p_password_hash);
    
    SET user_id = LAST_INSERT_ID();
    
    -- Crear las 8 parcelas del terreno (2x4)
    WHILE i < 8 DO
        INSERT INTO user_plots (user_id, plot_position) VALUES (user_id, i);
        SET i = i + 1;
    END WHILE;
    
    -- Dar semillas iniciales (2 de cada tipo)
    INSERT INTO user_inventory (user_id, seed_type_id, quantity)
    SELECT user_id, id, 2 FROM seed_types;
    
    -- Inicializar inventario de frutos (0 de cada tipo)
    INSERT INTO user_fruits (user_id, seed_type_id, quantity)
    SELECT user_id, id, 0 FROM seed_types;
    
    SELECT user_id as new_user_id;
END //
DELIMITER ;

-- Función para calcular el progreso de crecimiento de una planta
DELIMITER //
CREATE FUNCTION GetPlantGrowthProgress(
    planted_at TIMESTAMP,
    growth_time_hours INT
) RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE hours_elapsed DECIMAL(10,2);
    DECLARE progress DECIMAL(5,2);
    
    SET hours_elapsed = TIMESTAMPDIFF(SECOND, planted_at, NOW()) / 3600;
    SET progress = LEAST(100.00, (hours_elapsed / growth_time_hours) * 100);
    
    RETURN progress;
END //
DELIMITER ;

-- Procedimiento para cosechar una planta
DELIMITER //
CREATE PROCEDURE HarvestPlant(
    IN p_user_id INT,
    IN p_plot_position INT
)
BEGIN
    DECLARE v_seed_type_id INT;
    DECLARE v_experience_reward INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION ROLLBACK;
    
    START TRANSACTION;
    
    -- Obtener información de la planta
    SELECT seed_type_id INTO v_seed_type_id
    FROM user_plots 
    WHERE user_id = p_user_id AND plot_position = p_plot_position AND is_ready_to_harvest = TRUE;
    
    IF v_seed_type_id IS NOT NULL THEN
        -- Obtener recompensa de experiencia
        SELECT experience_reward INTO v_experience_reward
        FROM seed_types WHERE id = v_seed_type_id;
        
        -- Dar experiencia al usuario
        UPDATE users SET experience = experience + v_experience_reward WHERE id = p_user_id;
        
        -- Dar 2 semillas nuevas
        INSERT INTO user_inventory (user_id, seed_type_id, quantity)
        VALUES (p_user_id, v_seed_type_id, 2)
        ON DUPLICATE KEY UPDATE quantity = quantity + 2;
        
        -- Dar 1 fruto
        INSERT INTO user_fruits (user_id, seed_type_id, quantity)
        VALUES (p_user_id, v_seed_type_id, 1)
        ON DUPLICATE KEY UPDATE quantity = quantity + 1;
        
        -- Limpiar la parcela
        UPDATE user_plots 
        SET seed_type_id = NULL, planted_at = NULL, is_ready_to_harvest = FALSE
        WHERE user_id = p_user_id AND plot_position = p_plot_position;
        
        COMMIT;
        SELECT 'success' as result, v_experience_reward as experience_gained;
    ELSE
        ROLLBACK;
        SELECT 'error' as result, 'Plot not ready for harvest' as message;
    END IF;
END //
DELIMITER ;