const { verifyToken } = require("../utils/jwt");
const pool = require("../db/pool");

// Verifies the Bearer token and attaches the current user to req.user
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const decoded = verifyToken(token);
    const result = await pool.query(
      `SELECT id, name, email, role, department, status FROM users WHERE id = $1`,
      [decoded.sub]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "User no longer exists." });
    if (user.status !== "Active") return res.status(403).json({ error: "Account is inactive." });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Restricts a route to one or more roles, e.g. requireRole('System Admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
