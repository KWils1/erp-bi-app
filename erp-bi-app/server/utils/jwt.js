const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

if (!SECRET || SECRET === "change_this_to_a_long_random_string") {
  console.warn(
    "⚠️  WARNING: JWT_SECRET is not set to a secure value. Set a strong random JWT_SECRET in your .env before deploying beyond local use."
  );
}

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
