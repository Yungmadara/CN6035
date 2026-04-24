# -*- coding: utf-8 -*-
"""
Παράγει το database/seed.sql με enriched descriptions + 144 θέσεις ανά showtime.
Χρήση: python database/generate-seed.py
"""
import sys, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

THEATRES = [
    ("Εθνικό Θέατρο", "Αθήνα, Αγίου Κωνσταντίνου 22", "Το κεντρικό θέατρο της Ελλάδας με ιστορία από το 1900."),
    ("Θέατρο Βρετάνια", "Αθήνα, Πανεπιστημίου 7", "Κλασικό θέατρο στο κέντρο της Αθήνας."),
    ("ΚΘΒΕ - Κρατικό Θέατρο Βορείου Ελλάδος", "Θεσσαλονίκη, Εθνικής Αμύνης 2", "Το μεγαλύτερο θέατρο της Βόρειας Ελλάδας."),
    ("Θέατρο Λυκαβηττού", "Αθήνα, Λόφος Λυκαβηττού", "Υπαίθριο θέατρο με εντυπωσιακή θέα στην Αθήνα."),
    ("Ωδείο Ηρώδου Αττικού", "Αθήνα, Ακρόπολη", "Αρχαίο ωδείο του 2ου αιώνα μ.Χ. στους νότιους πρόποδες της Ακρόπολης."),
    ("Δημοτικό Θέατρο Πειραιά", "Πειραιάς, Πλατεία Κοτζιά", "Νεοκλασικό θέατρο του 1895, στολίδι του Πειραιά."),
]

# (theatre_id, title, description, duration, age_rating)
SHOWS = [
    (1, "Αντιγόνη", "Η κλασική τραγωδία του Σοφοκλή για την αντίθεση ανάμεσα στον γραπτό και τον άγραφο νόμο. Σκηνοθεσία: Στάθης Λιβαθινός. Πρωταγωνιστούν: Αλεξία Καλτσίκη, Νίκος Κουρής, Αιμίλιος Χειλάκης.", 110, "12+"),
    (1, "Ηλέκτρα", "Τραγωδία του Σοφοκλή σε σύγχρονη ανάγνωση. Σκηνοθεσία: Αιμίλιος Χειλάκης. Πρωταγωνιστούν: Λένα Παπαληγούρα, Αλέξανδρος Μαυρόπουλος.", 95, "14+"),
    (2, "Ο Βυσσινόκηπος", "Κωμωδία του Άντον Τσέχωφ για το τέλος μιας εποχής. Σκηνοθεσία: Γιάννης Χουβαρδάς. Πρωταγωνιστούν: Άννα Κοκκίνου, Δημήτρης Πιατάς.", 130, "Κ"),
    (2, "Δον Ζουάν", "Η κλασική κωμωδία του Μολιέρου. Σκηνοθεσία: Βαγγέλης Θεοδωρόπουλος. Πρωταγωνιστούν: Κωνσταντίνος Μαρκουλάκης, Μαρία Κίτσου.", 100, "Κ"),
    (3, "Ρωμαίος και Ιουλιέτα", "Το αθάνατο έργο του Σαίξπηρ για τον απαγορευμένο έρωτα. Σκηνοθεσία: Γιάννης Αναστασάκης. Πρωταγωνιστούν: Χρήστος Λούλης, Κόρα Καρβούνη.", 120, "10+"),
    (4, "Οιδίπους Τύραννος", "Η αριστουργηματική τραγωδία του Σοφοκλή για το πεπρωμένο. Σκηνοθεσία: Γιάννης Κακλέας. Πρωταγωνιστούν: Γιάννης Στάνκογλου, Δήμητρα Παπαδήμα.", 105, "14+"),
    (4, "Λυσιστράτη", "Η κωμωδία του Αριστοφάνη για την ειρήνη και τον έρωτα. Σκηνοθεσία: Σωτήρης Χατζάκης. Πρωταγωνιστούν: Σμαράγδα Καρύδη, Μαρία Ναυπλιώτου.", 90, "Κ"),
    (4, "Μήδεια", "Η συγκλονιστική τραγωδία του Ευριπίδη. Σκηνοθεσία: Κατερίνα Ευαγγελάτου. Πρωταγωνιστούν: Αλεξία Καλτσίκη, Χρήστος Στέργιογλου.", 100, "16+"),
    (5, "Αγαμέμνων", "Πρώτο μέρος της Ορέστειας του Αισχύλου. Σκηνοθεσία: Θοδωρής Τερζόπουλος. Πρωταγωνιστούν: Τάσος Δήμας, Σοφία Χιλλ.", 115, "14+"),
    (5, "Πέρσες", "Η αρχαιότερη σωζόμενη τραγωδία του Αισχύλου. Σκηνοθεσία: Γιώργος Πετρίδης. Πρωταγωνιστούν: Άκης Σακελλαρίου, Λυδία Φωτοπούλου.", 95, "12+"),
    (5, "Νεφέλες", "Κωμωδία του Αριστοφάνη με θέμα τη φιλοσοφία. Σκηνοθεσία: Σωτήρης Χατζάκης. Πρωταγωνιστούν: Γεράσιμος Σκιαδαρέσης, Βασίλης Χαραλαμπόπουλος.", 100, "Κ"),
    (6, "Θείος Βάνιας", "Δράμα του Τσέχωφ για την απογοήτευση και τον έρωτα. Σκηνοθεσία: Ρούλα Πατεράκη. Πρωταγωνιστούν: Αλέξανδρος Μαυρόπουλος, Άννα Μάσχα.", 125, "Κ"),
    (6, "Ο Έμπορος της Βενετίας", "Το κλασικό έργο του Σαίξπηρ. Σκηνοθεσία: Στάθης Λιβαθινός. Πρωταγωνιστούν: Δημήτρης Λιγνάδης, Ιωάννα Παππά.", 115, "12+"),
    (3, "Βάκχες", "Η τελευταία τραγωδία του Ευριπίδη. Σκηνοθεσία: Θωμάς Μοσχόπουλος. Πρωταγωνιστούν: Γιώργος Κιμούλης, Αμαλία Μουτούση.", 110, "14+"),
]

# (show_id, date, time, room, price)
SHOWTIMES = [
    (1, "2026-05-05", "20:00:00", "Κεντρική Σκηνή", 25.00),
    (1, "2026-05-06", "20:00:00", "Κεντρική Σκηνή", 25.00),
    (2, "2026-05-10", "19:30:00", "Μικρή Σκηνή", 20.00),
    (3, "2026-05-07", "21:00:00", "Αίθουσα Α", 22.00),
    (4, "2026-05-08", "20:30:00", "Αίθουσα Β", 18.00),
    (5, "2026-05-12", "20:00:00", "Μεγάλη Σκηνή", 30.00),
    (6, "2026-05-14", "20:30:00", "Κεντρική Σκηνή", 28.00),
    (6, "2026-05-21", "20:30:00", "Κεντρική Σκηνή", 28.00),
    (7, "2026-05-16", "21:00:00", "Κεντρική Σκηνή", 22.00),
    (7, "2026-06-02", "21:00:00", "Κεντρική Σκηνή", 22.00),
    (8, "2026-05-25", "19:30:00", "Κεντρική Σκηνή", 25.00),
    (9, "2026-05-18", "20:00:00", "Μεγάλη Σκηνή", 35.00),
    (9, "2026-05-19", "20:00:00", "Μεγάλη Σκηνή", 35.00),
    (10, "2026-06-05", "20:00:00", "Μεγάλη Σκηνή", 32.00),
    (11, "2026-05-22", "21:00:00", "Μεγάλη Σκηνή", 30.00),
    (12, "2026-05-17", "20:00:00", "Αίθουσα Α", 24.00),
    (12, "2026-06-01", "20:00:00", "Αίθουσα Α", 24.00),
    (13, "2026-05-23", "19:30:00", "Αίθουσα Β", 26.00),
    (14, "2026-05-11", "20:30:00", "Μεγάλη Σκηνή", 28.00),
    (14, "2026-05-26", "20:30:00", "Μεγάλη Σκηνή", 28.00),
]

# 12 rows × 12 cols = 144 seats
# VIP: rows A-B (24 seats)
# Standard: rows C-H (72 seats)
# Economy: rows I-L (48 seats)
ROW_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L']
COLS = 12
TOTAL_SEATS = len(ROW_LETTERS) * COLS  # 144

def row_category(row):
    if row in ('A', 'B'):
        return 'VIP'
    if row in ('C', 'D', 'E', 'F', 'G', 'H'):
        return 'Standard'
    return 'Economy'

def sql_escape(s):
    return s.replace("'", "''")

lines = []
lines.append("-- CN6035 Theatre Reservation App")
lines.append("-- Seed Data (auto-generated — see database/generate-seed.py)")
lines.append("")
lines.append("USE theatre_db;")
lines.append("")

# Theatres
lines.append("-- Theatres")
lines.append("INSERT INTO theatres (name, location, description) VALUES")
theatre_values = []
for name, loc, desc in THEATRES:
    theatre_values.append(f"('{sql_escape(name)}', '{sql_escape(loc)}', '{sql_escape(desc)}')")
lines.append(",\n".join(theatre_values) + ";")
lines.append("")

# Shows
lines.append("-- Shows (με σκηνοθέτη + ηθοποιούς)")
lines.append("INSERT INTO shows (theatre_id, title, description, duration, age_rating) VALUES")
show_values = []
for theatre_id, title, desc, duration, age in SHOWS:
    show_values.append(f"({theatre_id}, '{sql_escape(title)}', '{sql_escape(desc)}', {duration}, '{age}')")
lines.append(",\n".join(show_values) + ";")
lines.append("")

# Showtimes
lines.append(f"-- Showtimes (total_seats={TOTAL_SEATS} each)")
lines.append("INSERT INTO showtimes (show_id, date, time, room, total_seats, available_seats, price) VALUES")
showtime_values = []
for show_id, date, time, room, price in SHOWTIMES:
    showtime_values.append(f"({show_id}, '{date}', '{time}', '{sql_escape(room)}', {TOTAL_SEATS}, {TOTAL_SEATS}, {price:.2f})")
lines.append(",\n".join(showtime_values) + ";")
lines.append("")

# Seats (144 per showtime)
lines.append(f"-- Seats ({TOTAL_SEATS} θέσεις ανά showtime × {len(SHOWTIMES)} showtimes)")
for st_index in range(1, len(SHOWTIMES) + 1):
    lines.append(f"-- Seats for showtime {st_index}")
    lines.append("INSERT INTO seats (showtime_id, seat_number, category) VALUES")
    seat_values = []
    for row in ROW_LETTERS:
        for col in range(1, COLS + 1):
            seat_number = f"{row}{col}"
            category = row_category(row)
            seat_values.append(f"({st_index},'{seat_number}','{category}')")
    lines.append(",\n".join(seat_values) + ";")
    lines.append("")

output = "\n".join(lines)

out_path = os.path.join(os.path.dirname(__file__), "seed.sql")
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(output)

print(f"Wrote {out_path}")
print(f"  Theatres: {len(THEATRES)}")
print(f"  Shows: {len(SHOWS)}")
print(f"  Showtimes: {len(SHOWTIMES)}")
print(f"  Seats total: {TOTAL_SEATS * len(SHOWTIMES)} ({TOTAL_SEATS}/showtime)")
