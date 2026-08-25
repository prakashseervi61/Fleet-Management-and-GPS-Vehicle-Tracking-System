export function isValidName(name) {
  return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(String(name ?? '').trim())
}

export function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone ?? '').trim())
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim())
}

export function isValidPassword(password) {
  const value = String(password ?? '')
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

export function passwordsMatch(password, confirmPassword) {
  return Boolean(password) && password === confirmPassword
}

export function getPasswordStrength(password) {
  const value = String(password ?? '')
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return score
}
