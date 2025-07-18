-- Script para cambiar completamente el sistema a minutos

USE jardinero_virtual;

-- 1. Agregar nueva columna para minutos
ALTER TABLE seed_types 
ADD COLUMN growth_time_minutes INT NOT NULL DEFAULT 60 AFTER growth_time_hours;

-- 2. Convertir los valores actuales a minutos para testing
UPDATE seed_types SET growth_time_minutes = 2 WHERE name = 'Lechuga';     -- 2 minutos
UPDATE seed_types SET growth_time_minutes = 3 WHERE name = 'Tomate';      -- 3 minutos  
UPDATE seed_types SET growth_time_minutes = 5 WHERE name = 'Zanahoria';   -- 5 minutos
UPDATE seed_types SET growth_time_minutes = 10 WHERE name = 'Calabaza';   -- 10 minutos

-- 3. Verificar
SELECT name, growth_time_hours, growth_time_minutes, emoji FROM seed_types;

-- 4. DESPUÉS de verificar que funciona, eliminar la columna antigua
-- ALTER TABLE seed_types DROP COLUMN growth_time_hours;