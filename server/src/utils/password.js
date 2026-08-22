const bcrypt = require('bcryptjs');

/**
 * Hashes a plain-text password securely using bcryptjs.
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} The generated password hash.
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a plain-text password against a hash.
 * @param {string} password - The plain-text password to verify.
 * @param {string} hash - The password hash to verify against.
 * @returns {Promise<boolean>} True if the password matches the hash, false otherwise.
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};
