import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(_scrypt)
const KEY_LENGTH = 64

function getPepper(): string {
  const pepper = process.env.AUTH_PASSWORD_PEPPER || process.env.AUTH_SECRET
  if (!pepper) {
    throw new Error('Missing AUTH_PASSWORD_PEPPER (or AUTH_SECRET fallback) for password hashing')
  }
  return pepper
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const peppered = `${password}:${getPepper()}`
  const derived = (await scrypt(peppered, salt, KEY_LENGTH)) as Buffer
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  const salt = Buffer.from(parts[1], 'hex')
  const expected = Buffer.from(parts[2], 'hex')
  const peppered = `${password}:${getPepper()}`
  const derived = (await scrypt(peppered, salt, expected.length)) as Buffer

  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
