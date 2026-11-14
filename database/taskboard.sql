-- Task Board database (MySQL 8.x compatible)

CREATE DATABASE IF NOT EXISTS taskboard;

USE taskboard;

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
);

CREATE TABLE settings (
  id                 INT UNSIGNED NOT NULL DEFAULT 1,
  daily_point_limit  INT UNSIGNED NOT NULL,
  weekly_point_limit INT UNSIGNED NOT NULL,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_settings_single_row CHECK (id = 1),
  CONSTRAINT chk_settings_positive CHECK (daily_point_limit > 0 AND weekly_point_limit >= daily_point_limit)
); 

CREATE TABLE tasks (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title        VARCHAR(200) NOT NULL,
  description  TEXT NULL,
  story_points INT UNSIGNED NOT NULL,
  priority     ENUM('Low','Medium','High','Critical') NOT NULL,
  status       ENUM('Backlog','Planned','In Progress','Completed') NOT NULL DEFAULT 'Backlog',
  planned_date DATE NOT NULL,
  due_date     DATE NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_tasks_points CHECK (story_points > 0),
  CONSTRAINT chk_tasks_dates CHECK (due_date IS NULL OR due_date >= planned_date),
  KEY idx_tasks_status (status),
  KEY idx_tasks_priority (priority),
  KEY idx_tasks_capacity (planned_date, status),
  KEY idx_tasks_title (title)
); 

-- Seed: admin@test.com / Admin@123 (bcrypt)
INSERT INTO users (name, email, password_hash) VALUES
  ('Admin', 'admin@test.com', '$2b$10$UyXqjgSvemav3tRIueX84O2lo0wSwYTJ3YN7q7zjzYrBWQ/IyxsEy');

INSERT INTO settings (id, daily_point_limit, weekly_point_limit) VALUES (1, 8, 40);
