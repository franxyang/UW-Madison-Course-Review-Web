import { createHmac, randomInt } from 'crypto'

function getOtpSecret(): string {
  const otpSecret = process.env.AUTH_OTP_SECRET || process.env.AUTH_SECRET
  if (!otpSecret) {
    throw new Error('Missing AUTH_OTP_SECRET (or AUTH_SECRET fallback) for OTP hashing')
  }
  return otpSecret
}

export function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString()
}

export function hashOtp({ purpose, emailNormalized, code }: { purpose: string; emailNormalized: string; code: string }): string {
  const payload = `${purpose}:${emailNormalized}:${code}`
  return createHmac('sha256', getOtpSecret()).update(payload).digest('hex')
}
