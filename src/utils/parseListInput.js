const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 문자열 입력을 콤마/줄바꿈 기준 목록으로 파싱할 때 사용한다.
 */
export function parseListInput(rawValue) {
  return String(rawValue || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 목록 입력을 중복 제거된 배열로 정규화할 때 사용한다.
 */
export function normalizeUniqueList(rawValue, { toLower = false } = {}) {
  const values = parseListInput(rawValue);
  const set = new Set();

  for (const value of values) {
    set.add(toLower ? value.toLowerCase() : value);
  }

  return [...set];
}

/**
 * 이메일 목록을 유효/무효 목록으로 분리할 때 사용한다.
 */
export function validateEmails(emails) {
  const valid = [];
  const invalid = [];

  for (const email of emails) {
    if (!EMAIL_PATTERN.test(email)) {
      invalid.push(email);
      continue;
    }

    valid.push(email);
  }

  return { valid, invalid };
}
