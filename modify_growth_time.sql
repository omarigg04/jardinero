-- Script para modificar los tiempos de crecimiento a minutos con decimales

USE jardinero_virtual;

-- 1. Cambiar la columna a DECIMAL para aceptar decimales
ALTER TABLE seed_types 
MODIFY COLUMN growth_time_hours DECIMAL(6,4) NOT NULL COMMENT 'Tiempo de crecimiento en horas (acepta decimales)';

-- 2. Actualizar los tiempos a minutos (para testing rápido)
-- Nota: Los valores están en horas, así que 0.0167 = 1 minuto

UPDATE seed_types SET growth_time_hours = 0.0333 WHERE name = 'Lechuga';    -- 2 minutos
UPDATE seed_types SET growth_time_hours = 0.0500 WHERE name = 'Tomate';     -- 3 minutos  
UPDATE seed_types SET growth_time_hours = 0.0833 WHERE name = 'Zanahoria';  -- 5 minutos
UPDATE seed_types SET growth_time_hours = 0.1667 WHERE name = 'Calabaza';   -- 10 minutos

-- 3. Verificar los cambios
SELECT 
    name,
    growth_time_hours,
    ROUND(growth_time_hours * 60, 1) as growth_time_minutes,
    buy_price,
    sell_price,
    fruit_sell_price,
    emoji
FROM seed_types 
ORDER BY growth_time_hours;

-- 4. OPCIONAL: Si quieres cambiar a un enfoque completamente en minutos
-- ALTER TABLE seed_types ADD COLUMN growth_time_minutes INT AFTER growth_time_hours;
-- UPDATE seed_types SET growth_time_minutes = ROUND(growth_time_hours * 60);
-- -- Luego modificarías el código para usar growth_time_minutes