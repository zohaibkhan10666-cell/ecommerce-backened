import crypto from 'crypto'

const ITERATIONS = Number(process.env.PBKDF2_ITERATIONS) || 100000
const KEYLEN = Number(process.env.PBKDF2_KEYLEN) || 64
const DIGEST = process.env.PBKDF2_DIGEST || 'sha512'
const GLOBAL_SALT = process.env.PASSWORD_SALT || 'default_global_salt_change_me'

export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, GLOBAL_SALT, ITERATIONS, KEYLEN, DIGEST, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey.toString('hex'))
    })
  })
}

export const comparePassword = async (password, hashed) => {
  const derived = await hashPassword(password)
  try {
    const a = Buffer.from(derived, 'hex')
    const b = Buffer.from(hashed, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch (e) {
    return false
  }
}
