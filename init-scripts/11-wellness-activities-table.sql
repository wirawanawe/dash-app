-- Create wellness_activities table for mobile app
CREATE TABLE IF NOT EXISTS wellness_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    duration_minutes INT,
    calories_burn INT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    instructions TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active),
    INDEX idx_created (created_at)
);

-- Insert sample wellness activities
INSERT INTO wellness_activities (name, description, category, duration_minutes, calories_burn, difficulty_level, instructions, is_active) VALUES
('Morning Meditation', 'A peaceful morning meditation session to start your day with clarity and calmness', 'meditation', 15, 30, 'beginner', '1. Find a comfortable seated position\n2. Close your eyes and take deep breaths\n3. Focus on your breath for 15 minutes\n4. Gradually return to normal awareness', TRUE),
('Sun Salutation Yoga', 'Classic yoga sequence to energize your body and mind', 'yoga', 20, 80, 'beginner', '1. Start in mountain pose\n2. Flow through sun salutation A\n3. Repeat 5-10 times\n4. End in child\'s pose', TRUE),
('Quick Cardio Workout', 'High-intensity cardio session for maximum calorie burn', 'cardio', 30, 300, 'intermediate', '1. 5 minutes warm-up\n2. 20 minutes high-intensity intervals\n3. 5 minutes cool-down\n4. Stretch thoroughly', TRUE),
('Breathing Exercise', 'Deep breathing technique for stress relief and relaxation', 'breathing', 10, 15, 'beginner', '1. Sit comfortably with straight back\n2. Inhale deeply for 4 counts\n3. Hold for 4 counts\n4. Exhale for 4 counts\n5. Repeat for 10 minutes', TRUE),
('Mindfulness Walk', 'Walking meditation to connect with nature and present moment', 'mindfulness', 25, 120, 'beginner', '1. Walk slowly and deliberately\n2. Focus on each step\n3. Notice your surroundings\n4. Stay present in the moment', TRUE),
('Stretching Routine', 'Full-body stretching to improve flexibility and reduce tension', 'stretching', 15, 45, 'beginner', '1. Neck and shoulder stretches\n2. Arm and chest stretches\n3. Back and core stretches\n4. Leg and hip stretches', TRUE),
('Strength Training', 'Basic strength exercises for muscle building', 'strength', 45, 250, 'intermediate', '1. Warm-up with light cardio\n2. Squats: 3 sets of 12 reps\n3. Push-ups: 3 sets of 10 reps\n4. Planks: 3 sets of 30 seconds', TRUE),
('Flexibility Flow', 'Dynamic stretching to improve range of motion', 'flexibility', 20, 60, 'beginner', '1. Dynamic arm circles\n2. Hip circles and leg swings\n3. Cat-cow stretches\n4. Butterfly stretches', TRUE),
('Relaxation Session', 'Progressive muscle relaxation for deep rest', 'relaxation', 20, 25, 'beginner', '1. Lie down comfortably\n2. Tense and relax each muscle group\n3. Focus on breathing\n4. Let go of all tension', TRUE),
('Advanced Yoga Flow', 'Challenging yoga sequence for experienced practitioners', 'yoga', 60, 200, 'advanced', '1. Sun salutation A and B\n2. Standing poses sequence\n3. Balancing poses\n4. Inversions and backbends\n5. Final relaxation', TRUE);

-- Create wellness_challenges table for future use
CREATE TABLE IF NOT EXISTS wellness_challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    target_activities INT,
    reward_points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_duration (duration_days)
);

-- Create user_wellness_activities table to track user participation
CREATE TABLE IF NOT EXISTS user_wellness_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    calories_burn INT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES wellness_activities(id) ON DELETE CASCADE,
    INDEX idx_user_activity (user_id, activity_id),
    INDEX idx_completed (completed_at)
);

-- Create user_wellness_challenges table to track challenge participation
CREATE TABLE IF NOT EXISTS user_wellness_challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    progress_activities INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES wellness_challenges(id) ON DELETE CASCADE,
    INDEX idx_user_challenge (user_id, challenge_id),
    INDEX idx_completed (is_completed)
); 