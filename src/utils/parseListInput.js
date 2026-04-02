const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseListInput(rawValue) {
  return String(rawValue || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeUniqueList(rawValue, { toLower = false } = {}) {
  const values = parseListInput(rawValue);
  const set = new Set();

  for (const value of values) {
    set.add(toLower ? value.toLowerCase() : value);
  }

  return [...set];
}

export function validateEmails(emails) {
  const valid = [];
  const invalid = [];

  for (const email of emails) {
    if (EMAIL_PATTERN.test(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}
