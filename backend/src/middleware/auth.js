// ============================================================
//  JWT Authentication Middleware
// ============================================================
//
//  Express middleware που προστατεύει routes που απαιτούν
//  authenticated user. Διαβάζει το JWT από το header
//  "Authorization: Bearer <token>", το επαληθεύει με το
//  JWT_SECRET, και προσθέτει το decoded payload στο req.user.
//
//  Χρήση σε route:
//    router.get('/protected', authMiddleware, handler);
//
//  Status codes:
//    401 Unauthorized — δεν στάλθηκε token
//    403 Forbidden    — token υπάρχει αλλά είναι invalid/expired
// ============================================================

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Format του header: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Δεν υπάρχει καν token → 401
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Επαλήθευση signature + expiration. Αν αποτύχει, throw.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Το decoded payload γίνεται προσβάσιμο σε όλα τα handlers ως req.user
    // (περιέχει { userId, email } όπως το έθεσε το /login endpoint)
    req.user = decoded;
    next(); // Επιτυχία → συνέχισε στον επόμενο handler
  } catch (err) {
    // Λάθος signature, ληγμένο token, malformed JWT, κλπ.
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
