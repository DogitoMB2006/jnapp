const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export const normalizeUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")

export const isValidUsername = (value: string) => USERNAME_REGEX.test(value)
