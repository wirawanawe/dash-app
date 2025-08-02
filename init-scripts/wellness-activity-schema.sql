-- Wellness Activity Schema
-- Morning activities stored in wellness_activity table (master data)
-- User wellness activity data stored in user_wellness_activity table

-- Create wellness_activity table for morning activities (master data)
CREATE TABLE IF NOT EXISTS wellness_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    duration_minutes INT DEFAULT 30,
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    points INT DEFAULT 10,
    calories_burn INT DEFAULT 0,
    instructions TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active),
    INDEX idx_created (created_at)
);

-- Create user_wellness_activity table for user wellness activity data
CREATE TABLE IF NOT EXISTS user_wellness_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    duration_minutes INT,
    notes TEXT,
    points_earned INT DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES wellness_activity(id) ON DELETE CASCADE,
    INDEX idx_user_activity (user_id, activity_id),
    INDEX idx_completed (completed_at),
    INDEX idx_user_date (user_id, completed_at)
);

-- Insert sample morning wellness activities
INSERT INTO wellness_activity (title, description, category, duration_minutes, difficulty, points, calories_burn, instructions, is_active) VALUES
('Morning Meditation', 'A peaceful morning meditation session to start your day with clarity and calmness', 'meditation', 15, 'beginner', 15, 30, '1. Find a comfortable seated position\n2. Close your eyes and take deep breaths\n3. Focus on your breath for 15 minutes\n4. Gradually return to normal awareness', TRUE),
('Sun Salutation Yoga', 'Classic yoga sequence to energize your body and mind', 'yoga', 20, 'beginner', 20, 80, '1. Start in mountain pose\n2. Flow through sun salutation A\n3. Repeat 5-10 times\n4. End in child\'s pose', TRUE),
('Morning Walk', 'Gentle morning walk to boost energy and mood', 'walking', 30, 'beginner', 25, 120, '1. Start with a slow pace\n2. Gradually increase speed\n3. Focus on your breathing\n4. Enjoy the morning air', TRUE),
('Breathing Exercise', 'Deep breathing technique for stress relief and relaxation', 'breathing', 10, 'beginner', 10, 15, '1. Sit comfortably with straight back\n2. Inhale deeply for 4 counts\n3. Hold for 4 counts\n4. Exhale for 4 counts\n5. Repeat for 10 minutes', TRUE),
('Morning Stretching', 'Full-body stretching to improve flexibility and reduce tension', 'stretching', 15, 'beginner', 15, 45, '1. Neck and shoulder stretches\n2. Arm and chest stretches\n3. Back and core stretches\n4. Leg and hip stretches', TRUE),
('Mindfulness Practice', 'Mindfulness session to cultivate awareness and presence', 'mindfulness', 20, 'beginner', 20, 25, '1. Find a quiet space\n2. Sit comfortably\n3. Focus on present moment\n4. Observe thoughts without judgment', TRUE),
('Light Cardio', 'Light cardio session to get your heart rate up', 'cardio', 25, 'beginner', 30, 150, '1. 5 minutes warm-up\n2. 15 minutes light jogging or cycling\n3. 5 minutes cool-down', TRUE),
('Strength Training', 'Basic strength exercises for muscle building', 'strength', 45, 'intermediate', 40, 250, '1. Warm-up with light cardio\n2. Squats: 3 sets of 12 reps\n3. Push-ups: 3 sets of 10 reps\n4. Planks: 3 sets of 30 seconds', TRUE),
('Flexibility Flow', 'Dynamic stretching to improve range of motion', 'flexibility', 20, 'beginner', 20, 60, '1. Dynamic arm circles\n2. Hip circles and leg swings\n3. Cat-cow stretches\n4. Butterfly stretches', TRUE),
('Relaxation Session', 'Progressive muscle relaxation for deep rest', 'relaxation', 20, 'beginner', 15, 25, '1. Lie down comfortably\n2. Tense and relax each muscle group\n3. Focus on breathing\n4. Let go of all tension', TRUE); 