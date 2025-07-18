-- Actualizar la función para usar minutos en lugar de horas

USE jardinero_virtual;

-- Eliminar la función existente
DROP FUNCTION IF EXISTS GetPlantGrowthProgress;

-- Crear nueva función que usa minutos
DELIMITER //
CREATE FUNCTION GetPlantGrowthProgress(
    planted_at TIMESTAMP,
    growth_time_minutes INT  -- Ahora en minutos
) RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE minutes_elapsed DECIMAL(10,2);
    DECLARE progress DECIMAL(5,2);
    
    -- Calcular minutos transcurridos (en lugar de horas)
    SET minutes_elapsed = TIMESTAMPDIFF(SECOND, planted_at, NOW()) / 60;
    SET progress = LEAST(100.00, (minutes_elapsed / growth_time_minutes) * 100);
    
    RETURN progress;
END //
DELIMITER ;