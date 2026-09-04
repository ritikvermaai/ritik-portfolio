function safeString(value, maxLength = 500) {
  return String(value ?? '').trim().slice(0, maxLength);
}
module.exports = { safeString };
