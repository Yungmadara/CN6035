require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const theatreRoutes = require('./src/routes/theatres');
const showRoutes = require('./src/routes/shows');
const seatRoutes = require('./src/routes/seats');
const reservationRoutes = require('./src/routes/reservations');

const app = express();

app.use(cors());
app.use(express.json());

// Auth
app.use('/api', authRoutes);

// Resources
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/showtimes', seatRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/user', reservationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Theatre Reservation API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
