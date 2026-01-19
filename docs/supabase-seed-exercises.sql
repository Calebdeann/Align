-- =============================================
-- ALIGN WORKOUT TRACKER - SEED EXERCISES
-- =============================================
-- Run this AFTER running supabase-schema.sql
-- This seeds 35 common gym exercises

INSERT INTO exercises (name, muscle, equipment) VALUES
-- CHEST (6 exercises)
('Bench Press', 'Chest', 'Barbell'),
('Incline Bench Press', 'Chest', 'Barbell'),
('Chest Press', 'Chest', 'Machine'),
('Dumbbell Fly', 'Chest', 'Dumbbell'),
('Cable Crossover', 'Chest', 'Cable'),
('Push-up', 'Chest', 'Bodyweight'),

-- BACK (6 exercises)
('Lat Pulldown', 'Back', 'Cable'),
('Seated Row', 'Back', 'Cable'),
('Bent Over Row', 'Back', 'Barbell'),
('Pull-up', 'Back', 'Bodyweight'),
('T-Bar Row', 'Back', 'Machine'),
('Face Pull', 'Back', 'Cable'),

-- LEGS (7 exercises)
('Squat', 'Legs', 'Barbell'),
('Leg Press', 'Legs', 'Machine'),
('Leg Extension', 'Legs', 'Machine'),
('Leg Curl', 'Legs', 'Machine'),
('Romanian Deadlift', 'Legs', 'Barbell'),
('Calf Raise', 'Legs', 'Machine'),
('Lunges', 'Legs', 'Dumbbell'),

-- SHOULDERS (5 exercises)
('Shoulder Press', 'Shoulders', 'Machine'),
('Overhead Press', 'Shoulders', 'Barbell'),
('Lateral Raise', 'Shoulders', 'Dumbbell'),
('Front Raise', 'Shoulders', 'Dumbbell'),
('Rear Delt Fly', 'Shoulders', 'Machine'),

-- ARMS (6 exercises)
('Bicep Curl', 'Arms', 'Dumbbell'),
('Barbell Curl', 'Arms', 'Barbell'),
('Hammer Curl', 'Arms', 'Dumbbell'),
('Tricep Pushdown', 'Arms', 'Cable'),
('Tricep Extension', 'Arms', 'Dumbbell'),
('Skull Crusher', 'Arms', 'Barbell'),

-- CORE (5 exercises)
('Plank', 'Core', 'Bodyweight'),
('Crunch', 'Core', 'Bodyweight'),
('Leg Raise', 'Core', 'Bodyweight'),
('Russian Twist', 'Core', 'Bodyweight'),
('Cable Crunch', 'Core', 'Cable');

-- Verify the insert worked
SELECT muscle, COUNT(*) as count FROM exercises GROUP BY muscle ORDER BY muscle;
