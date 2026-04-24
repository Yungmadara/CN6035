-- CN6035 Theatre Reservation App
-- Database Schema

CREATE DATABASE IF NOT EXISTS theatre_db;
USE theatre_db;

CREATE TABLE users (
  user_id   INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  email     VARCHAR(100) UNIQUE NOT NULL,
  password  VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE theatres (
  theatre_id  INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  location    VARCHAR(200),
  description TEXT
);

CREATE TABLE shows (
  show_id     INT AUTO_INCREMENT PRIMARY KEY,
  theatre_id  INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  duration    INT,
  age_rating  VARCHAR(10),
  FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id) ON DELETE CASCADE
);

CREATE TABLE showtimes (
  showtime_id     INT AUTO_INCREMENT PRIMARY KEY,
  show_id         INT NOT NULL,
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  room            VARCHAR(50),
  total_seats     INT NOT NULL,
  available_seats INT NOT NULL,
  price           DECIMAL(8,2),
  FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE
);

CREATE TABLE seats (
  seat_id      INT AUTO_INCREMENT PRIMARY KEY,
  showtime_id  INT NOT NULL,
  seat_number  VARCHAR(10) NOT NULL,
  category     VARCHAR(50) DEFAULT 'Standard',
  is_available BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE
);

CREATE TABLE reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  showtime_id    INT NOT NULL,
  seat_id        INT NOT NULL,
  reservation_reference VARCHAR(20),
  status         ENUM('confirmed','cancelled') DEFAULT 'confirmed',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(seat_id) ON DELETE CASCADE,
  INDEX idx_reservation_reference (reservation_reference)
);
