-- CN6035 Theatre Reservation App
-- Seed Data

USE theatre_db;

-- Theatres
INSERT INTO theatres (name, location, description) VALUES
('Εθνικό Θέατρο', 'Αθήνα, Αγίου Κωνσταντίνου 22', 'Το κεντρικό θέατρο της Ελλάδας με ιστορία από το 1900.'),
('Θέατρο Βρετάνια', 'Αθήνα, Πανεπιστημίου 7', 'Κλασικό θέατρο στο κέντρο της Αθήνας.'),
('ΚΘΒΕ - Κρατικό Θέατρο Βορείου Ελλάδος', 'Θεσσαλονίκη, Εθνικής Αμύνης 2', 'Το μεγαλύτερο θέατρο της Βόρειας Ελλάδας.'),
('Θέατρο Λυκαβηττού', 'Αθήνα, Λόφος Λυκαβηττού', 'Υπαίθριο θέατρο με εντυπωσιακή θέα στην Αθήνα.'),
('Ωδείο Ηρώδου Αττικού', 'Αθήνα, Ακρόπολη', 'Αρχαίο ωδείο του 2ου αιώνα μ.Χ. στους νότιους πρόποδες της Ακρόπολης.'),
('Δημοτικό Θέατρο Πειραιά', 'Πειραιάς, Πλατεία Κοτζιά', 'Νεοκλασικό θέατρο του 1895, στολίδι του Πειραιά.');

-- Shows
INSERT INTO shows (theatre_id, title, description, duration, age_rating) VALUES
(1, 'Αντιγόνη', 'Η κλασική τραγωδία του Σοφοκλή.', 110, '12+'),
(1, 'Ηλέκτρα', 'Τραγωδία του Σοφοκλή σε σύγχρονη ανάγνωση.', 95, '14+'),
(2, 'Ο Βυσσινόκηπος', 'Κωμωδία του Τσέχωφ.', 130, 'Κ'),
(2, 'Δον Ζουάν', 'Κλασική κωμωδία του Μολιέρου.', 100, 'Κ'),
(3, 'Ρωμαίος και Ιουλιέτα', 'Το αθάνατο έργο του Σαίξπηρ.', 120, '10+'),
(4, 'Οιδίπους Τύραννος', 'Η αριστουργηματική τραγωδία του Σοφοκλή για το πεπρωμένο.', 105, '14+'),
(4, 'Λυσιστράτη', 'Η κωμωδία του Αριστοφάνη για την ειρήνη και τον έρωτα.', 90, 'Κ'),
(4, 'Μήδεια', 'Η συγκλονιστική τραγωδία του Ευριπίδη.', 100, '16+'),
(5, 'Αγαμέμνων', 'Πρώτο μέρος της Ορέστειας του Αισχύλου.', 115, '14+'),
(5, 'Πέρσες', 'Η αρχαιότερη σωζόμενη τραγωδία του Αισχύλου.', 95, '12+'),
(5, 'Νεφέλες', 'Κωμωδία του Αριστοφάνη με θέμα τη φιλοσοφία.', 100, 'Κ'),
(6, 'Θείος Βάνιας', 'Δράμα του Τσέχωφ για την απογοήτευση και τον έρωτα.', 125, 'Κ'),
(6, 'Ο Έμπορος της Βενετίας', 'Το κλασικό έργο του Σαίξπηρ.', 115, '12+'),
(3, 'Βάκχες', 'Η τελευταία τραγωδία του Ευριπίδη.', 110, '14+');

-- Showtimes (existing)
INSERT INTO showtimes (show_id, date, time, room, total_seats, available_seats, price) VALUES
(1, '2026-04-05', '20:00:00', 'Κεντρική Σκηνή', 20, 20, 25.00),
(1, '2026-04-06', '20:00:00', 'Κεντρική Σκηνή', 20, 20, 25.00),
(2, '2026-04-10', '19:30:00', 'Μικρή Σκηνή', 20, 20, 20.00),
(3, '2026-04-07', '21:00:00', 'Αίθουσα Α', 20, 20, 22.00),
(4, '2026-04-08', '20:30:00', 'Αίθουσα Β', 20, 20, 18.00),
(5, '2026-04-12', '20:00:00', 'Μεγάλη Σκηνή', 20, 20, 30.00),
-- New showtimes
(6,  '2026-04-14', '20:30:00', 'Κεντρική Σκηνή', 25, 25, 28.00),
(6,  '2026-04-21', '20:30:00', 'Κεντρική Σκηνή', 25, 25, 28.00),
(7,  '2026-04-16', '21:00:00', 'Κεντρική Σκηνή', 25, 25, 22.00),
(7,  '2026-05-02', '21:00:00', 'Κεντρική Σκηνή', 25, 25, 22.00),
(8,  '2026-04-25', '19:30:00', 'Κεντρική Σκηνή', 20, 20, 25.00),
(9,  '2026-04-18', '20:00:00', 'Μεγάλη Σκηνή', 30, 30, 35.00),
(9,  '2026-04-19', '20:00:00', 'Μεγάλη Σκηνή', 30, 30, 35.00),
(10, '2026-05-05', '20:00:00', 'Μεγάλη Σκηνή', 30, 30, 32.00),
(11, '2026-04-22', '21:00:00', 'Μεγάλη Σκηνή', 30, 30, 30.00),
(12, '2026-04-17', '20:00:00', 'Αίθουσα Α', 20, 20, 24.00),
(12, '2026-05-01', '20:00:00', 'Αίθουσα Α', 20, 20, 24.00),
(13, '2026-04-23', '19:30:00', 'Αίθουσα Β', 20, 20, 26.00),
(14, '2026-04-11', '20:30:00', 'Μεγάλη Σκηνή', 25, 25, 28.00),
(14, '2026-04-26', '20:30:00', 'Μεγάλη Σκηνή', 25, 25, 28.00);

-- Seats for showtime 1 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(1,'A1','VIP'),(1,'A2','VIP'),(1,'A3','VIP'),(1,'A4','VIP'),(1,'A5','VIP'),
(1,'B1','Standard'),(1,'B2','Standard'),(1,'B3','Standard'),(1,'B4','Standard'),(1,'B5','Standard'),
(1,'C1','Standard'),(1,'C2','Standard'),(1,'C3','Standard'),(1,'C4','Standard'),(1,'C5','Standard'),
(1,'D1','Economy'),(1,'D2','Economy'),(1,'D3','Economy'),(1,'D4','Economy'),(1,'D5','Economy');

-- Seats for showtime 2 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(2,'A1','VIP'),(2,'A2','VIP'),(2,'A3','VIP'),(2,'A4','VIP'),(2,'A5','VIP'),
(2,'B1','Standard'),(2,'B2','Standard'),(2,'B3','Standard'),(2,'B4','Standard'),(2,'B5','Standard'),
(2,'C1','Standard'),(2,'C2','Standard'),(2,'C3','Standard'),(2,'C4','Standard'),(2,'C5','Standard'),
(2,'D1','Economy'),(2,'D2','Economy'),(2,'D3','Economy'),(2,'D4','Economy'),(2,'D5','Economy');

-- Seats for showtime 3 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(3,'A1','VIP'),(3,'A2','VIP'),(3,'A3','VIP'),(3,'A4','VIP'),(3,'A5','VIP'),
(3,'B1','Standard'),(3,'B2','Standard'),(3,'B3','Standard'),(3,'B4','Standard'),(3,'B5','Standard'),
(3,'C1','Standard'),(3,'C2','Standard'),(3,'C3','Standard'),(3,'C4','Standard'),(3,'C5','Standard'),
(3,'D1','Economy'),(3,'D2','Economy'),(3,'D3','Economy'),(3,'D4','Economy'),(3,'D5','Economy');

-- Seats for showtime 4 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(4,'A1','VIP'),(4,'A2','VIP'),(4,'A3','VIP'),(4,'A4','VIP'),(4,'A5','VIP'),
(4,'B1','Standard'),(4,'B2','Standard'),(4,'B3','Standard'),(4,'B4','Standard'),(4,'B5','Standard'),
(4,'C1','Standard'),(4,'C2','Standard'),(4,'C3','Standard'),(4,'C4','Standard'),(4,'C5','Standard'),
(4,'D1','Economy'),(4,'D2','Economy'),(4,'D3','Economy'),(4,'D4','Economy'),(4,'D5','Economy');

-- Seats for showtime 5 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(5,'A1','VIP'),(5,'A2','VIP'),(5,'A3','VIP'),(5,'A4','VIP'),(5,'A5','VIP'),
(5,'B1','Standard'),(5,'B2','Standard'),(5,'B3','Standard'),(5,'B4','Standard'),(5,'B5','Standard'),
(5,'C1','Standard'),(5,'C2','Standard'),(5,'C3','Standard'),(5,'C4','Standard'),(5,'C5','Standard'),
(5,'D1','Economy'),(5,'D2','Economy'),(5,'D3','Economy'),(5,'D4','Economy'),(5,'D5','Economy');

-- Seats for showtime 6 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(6,'A1','VIP'),(6,'A2','VIP'),(6,'A3','VIP'),(6,'A4','VIP'),(6,'A5','VIP'),
(6,'B1','Standard'),(6,'B2','Standard'),(6,'B3','Standard'),(6,'B4','Standard'),(6,'B5','Standard'),
(6,'C1','Standard'),(6,'C2','Standard'),(6,'C3','Standard'),(6,'C4','Standard'),(6,'C5','Standard'),
(6,'D1','Economy'),(6,'D2','Economy'),(6,'D3','Economy'),(6,'D4','Economy'),(6,'D5','Economy');

-- Seats for showtime 7 (25 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(7,'A1','VIP'),(7,'A2','VIP'),(7,'A3','VIP'),(7,'A4','VIP'),(7,'A5','VIP'),
(7,'B1','Standard'),(7,'B2','Standard'),(7,'B3','Standard'),(7,'B4','Standard'),(7,'B5','Standard'),
(7,'C1','Standard'),(7,'C2','Standard'),(7,'C3','Standard'),(7,'C4','Standard'),(7,'C5','Standard'),
(7,'D1','Economy'),(7,'D2','Economy'),(7,'D3','Economy'),(7,'D4','Economy'),(7,'D5','Economy'),
(7,'E1','Economy'),(7,'E2','Economy'),(7,'E3','Economy'),(7,'E4','Economy'),(7,'E5','Economy');

-- Seats for showtime 8 (25 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(8,'A1','VIP'),(8,'A2','VIP'),(8,'A3','VIP'),(8,'A4','VIP'),(8,'A5','VIP'),
(8,'B1','Standard'),(8,'B2','Standard'),(8,'B3','Standard'),(8,'B4','Standard'),(8,'B5','Standard'),
(8,'C1','Standard'),(8,'C2','Standard'),(8,'C3','Standard'),(8,'C4','Standard'),(8,'C5','Standard'),
(8,'D1','Economy'),(8,'D2','Economy'),(8,'D3','Economy'),(8,'D4','Economy'),(8,'D5','Economy'),
(8,'E1','Economy'),(8,'E2','Economy'),(8,'E3','Economy'),(8,'E4','Economy'),(8,'E5','Economy');

-- Seats for showtime 9 (25 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(9,'A1','VIP'),(9,'A2','VIP'),(9,'A3','VIP'),(9,'A4','VIP'),(9,'A5','VIP'),
(9,'B1','Standard'),(9,'B2','Standard'),(9,'B3','Standard'),(9,'B4','Standard'),(9,'B5','Standard'),
(9,'C1','Standard'),(9,'C2','Standard'),(9,'C3','Standard'),(9,'C4','Standard'),(9,'C5','Standard'),
(9,'D1','Economy'),(9,'D2','Economy'),(9,'D3','Economy'),(9,'D4','Economy'),(9,'D5','Economy'),
(9,'E1','Economy'),(9,'E2','Economy'),(9,'E3','Economy'),(9,'E4','Economy'),(9,'E5','Economy');

-- Seats for showtime 10 (25 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(10,'A1','VIP'),(10,'A2','VIP'),(10,'A3','VIP'),(10,'A4','VIP'),(10,'A5','VIP'),
(10,'B1','Standard'),(10,'B2','Standard'),(10,'B3','Standard'),(10,'B4','Standard'),(10,'B5','Standard'),
(10,'C1','Standard'),(10,'C2','Standard'),(10,'C3','Standard'),(10,'C4','Standard'),(10,'C5','Standard'),
(10,'D1','Economy'),(10,'D2','Economy'),(10,'D3','Economy'),(10,'D4','Economy'),(10,'D5','Economy'),
(10,'E1','Economy'),(10,'E2','Economy'),(10,'E3','Economy'),(10,'E4','Economy'),(10,'E5','Economy');

-- Seats for showtime 11 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(11,'A1','VIP'),(11,'A2','VIP'),(11,'A3','VIP'),(11,'A4','VIP'),(11,'A5','VIP'),
(11,'B1','Standard'),(11,'B2','Standard'),(11,'B3','Standard'),(11,'B4','Standard'),(11,'B5','Standard'),
(11,'C1','Standard'),(11,'C2','Standard'),(11,'C3','Standard'),(11,'C4','Standard'),(11,'C5','Standard'),
(11,'D1','Economy'),(11,'D2','Economy'),(11,'D3','Economy'),(11,'D4','Economy'),(11,'D5','Economy');

-- Seats for showtime 12 (30 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(12,'A1','VIP'),(12,'A2','VIP'),(12,'A3','VIP'),(12,'A4','VIP'),(12,'A5','VIP'),
(12,'B1','Standard'),(12,'B2','Standard'),(12,'B3','Standard'),(12,'B4','Standard'),(12,'B5','Standard'),
(12,'C1','Standard'),(12,'C2','Standard'),(12,'C3','Standard'),(12,'C4','Standard'),(12,'C5','Standard'),
(12,'D1','Economy'),(12,'D2','Economy'),(12,'D3','Economy'),(12,'D4','Economy'),(12,'D5','Economy'),
(12,'E1','Economy'),(12,'E2','Economy'),(12,'E3','Economy'),(12,'E4','Economy'),(12,'E5','Economy'),
(12,'F1','Economy'),(12,'F2','Economy'),(12,'F3','Economy'),(12,'F4','Economy'),(12,'F5','Economy');

-- Seats for showtime 13 (30 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(13,'A1','VIP'),(13,'A2','VIP'),(13,'A3','VIP'),(13,'A4','VIP'),(13,'A5','VIP'),
(13,'B1','Standard'),(13,'B2','Standard'),(13,'B3','Standard'),(13,'B4','Standard'),(13,'B5','Standard'),
(13,'C1','Standard'),(13,'C2','Standard'),(13,'C3','Standard'),(13,'C4','Standard'),(13,'C5','Standard'),
(13,'D1','Economy'),(13,'D2','Economy'),(13,'D3','Economy'),(13,'D4','Economy'),(13,'D5','Economy'),
(13,'E1','Economy'),(13,'E2','Economy'),(13,'E3','Economy'),(13,'E4','Economy'),(13,'E5','Economy'),
(13,'F1','Economy'),(13,'F2','Economy'),(13,'F3','Economy'),(13,'F4','Economy'),(13,'F5','Economy');

-- Seats for showtime 14 (30 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(14,'A1','VIP'),(14,'A2','VIP'),(14,'A3','VIP'),(14,'A4','VIP'),(14,'A5','VIP'),
(14,'B1','Standard'),(14,'B2','Standard'),(14,'B3','Standard'),(14,'B4','Standard'),(14,'B5','Standard'),
(14,'C1','Standard'),(14,'C2','Standard'),(14,'C3','Standard'),(14,'C4','Standard'),(14,'C5','Standard'),
(14,'D1','Economy'),(14,'D2','Economy'),(14,'D3','Economy'),(14,'D4','Economy'),(14,'D5','Economy'),
(14,'E1','Economy'),(14,'E2','Economy'),(14,'E3','Economy'),(14,'E4','Economy'),(14,'E5','Economy'),
(14,'F1','Economy'),(14,'F2','Economy'),(14,'F3','Economy'),(14,'F4','Economy'),(14,'F5','Economy');

-- Seats for showtime 15 (30 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(15,'A1','VIP'),(15,'A2','VIP'),(15,'A3','VIP'),(15,'A4','VIP'),(15,'A5','VIP'),
(15,'B1','Standard'),(15,'B2','Standard'),(15,'B3','Standard'),(15,'B4','Standard'),(15,'B5','Standard'),
(15,'C1','Standard'),(15,'C2','Standard'),(15,'C3','Standard'),(15,'C4','Standard'),(15,'C5','Standard'),
(15,'D1','Economy'),(15,'D2','Economy'),(15,'D3','Economy'),(15,'D4','Economy'),(15,'D5','Economy'),
(15,'E1','Economy'),(15,'E2','Economy'),(15,'E3','Economy'),(15,'E4','Economy'),(15,'E5','Economy'),
(15,'F1','Economy'),(15,'F2','Economy'),(15,'F3','Economy'),(15,'F4','Economy'),(15,'F5','Economy');

-- Seats for showtime 16 (30 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(16,'A1','VIP'),(16,'A2','VIP'),(16,'A3','VIP'),(16,'A4','VIP'),(16,'A5','VIP'),
(16,'B1','Standard'),(16,'B2','Standard'),(16,'B3','Standard'),(16,'B4','Standard'),(16,'B5','Standard'),
(16,'C1','Standard'),(16,'C2','Standard'),(16,'C3','Standard'),(16,'C4','Standard'),(16,'C5','Standard'),
(16,'D1','Economy'),(16,'D2','Economy'),(16,'D3','Economy'),(16,'D4','Economy'),(16,'D5','Economy'),
(16,'E1','Economy'),(16,'E2','Economy'),(16,'E3','Economy'),(16,'E4','Economy'),(16,'E5','Economy'),
(16,'F1','Economy'),(16,'F2','Economy'),(16,'F3','Economy'),(16,'F4','Economy'),(16,'F5','Economy');

-- Seats for showtime 17 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(17,'A1','VIP'),(17,'A2','VIP'),(17,'A3','VIP'),(17,'A4','VIP'),(17,'A5','VIP'),
(17,'B1','Standard'),(17,'B2','Standard'),(17,'B3','Standard'),(17,'B4','Standard'),(17,'B5','Standard'),
(17,'C1','Standard'),(17,'C2','Standard'),(17,'C3','Standard'),(17,'C4','Standard'),(17,'C5','Standard'),
(17,'D1','Economy'),(17,'D2','Economy'),(17,'D3','Economy'),(17,'D4','Economy'),(17,'D5','Economy');

-- Seats for showtime 18 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(18,'A1','VIP'),(18,'A2','VIP'),(18,'A3','VIP'),(18,'A4','VIP'),(18,'A5','VIP'),
(18,'B1','Standard'),(18,'B2','Standard'),(18,'B3','Standard'),(18,'B4','Standard'),(18,'B5','Standard'),
(18,'C1','Standard'),(18,'C2','Standard'),(18,'C3','Standard'),(18,'C4','Standard'),(18,'C5','Standard'),
(18,'D1','Economy'),(18,'D2','Economy'),(18,'D3','Economy'),(18,'D4','Economy'),(18,'D5','Economy');

-- Seats for showtime 19 (20 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(19,'A1','VIP'),(19,'A2','VIP'),(19,'A3','VIP'),(19,'A4','VIP'),(19,'A5','VIP'),
(19,'B1','Standard'),(19,'B2','Standard'),(19,'B3','Standard'),(19,'B4','Standard'),(19,'B5','Standard'),
(19,'C1','Standard'),(19,'C2','Standard'),(19,'C3','Standard'),(19,'C4','Standard'),(19,'C5','Standard'),
(19,'D1','Economy'),(19,'D2','Economy'),(19,'D3','Economy'),(19,'D4','Economy'),(19,'D5','Economy');

-- Seats for showtime 20 (25 seats)
INSERT INTO seats (showtime_id, seat_number, category) VALUES
(20,'A1','VIP'),(20,'A2','VIP'),(20,'A3','VIP'),(20,'A4','VIP'),(20,'A5','VIP'),
(20,'B1','Standard'),(20,'B2','Standard'),(20,'B3','Standard'),(20,'B4','Standard'),(20,'B5','Standard'),
(20,'C1','Standard'),(20,'C2','Standard'),(20,'C3','Standard'),(20,'C4','Standard'),(20,'C5','Standard'),
(20,'D1','Economy'),(20,'D2','Economy'),(20,'D3','Economy'),(20,'D4','Economy'),(20,'D5','Economy'),
(20,'E1','Economy'),(20,'E2','Economy'),(20,'E3','Economy'),(20,'E4','Economy'),(20,'E5','Economy');

