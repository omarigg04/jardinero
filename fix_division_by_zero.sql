-- Arreglar la función para evitar división por 0

USE jardinero_virtual;

-- Eliminar función existente
DROP FUNCTION IF EXISTS GetPlantGrowthProgress;

-- Crear función mejorada con protección contra división por 0
DELIMITER //
CREATE FUNCTION GetPlantGrowthProgress(
    planted_at TIMESTAMP,
    growth_time_hours DECIMAL(8,4)
) RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE hours_elapsed DECIMAL(10,2);
    DECLARE progress DECIMAL(5,2);
    
    -- ⭐ PROTECCIÓN: Si growth_time_hours es 0 o NULL, retornar 0
    IF growth_time_hours IS NULL OR growth_time_hours <= 0 THEN
        RETURN 0.00;
    END IF;
    
    -- ⭐ PROTECCIÓN: Si planted_at es NULL, retornar 0
    IF planted_at IS NULL THEN
        RETURN 0.00;
    END IF;
    
    -- Calcular tiempo transcurrido
    SET hours_elapsed = TIMESTAMPDIFF(SECOND, planted_at, NOW()) / 3600;
    
    -- Calcular progreso (máximo 100%)
    SET progress = LEAST(100.00, (hours_elapsed / growth_time_hours) * 100);
    
    RETURN progress;
END //
DELIMITER ;

-- Verificar que la función funciona
SELECT GetPlantGrowthProgress(NOW(), 0.0333) as test_progress;