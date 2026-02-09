export const HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/i

type HandleLookupClient = {
  user: {
    findUnique: (args: {
      where: { loginHandleNormalized: string }
      select: { id: true }
    }) => Promise<{ id: string } | null>
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isWiscEmail(email: string): boolean {
  return normalizeEmail(email).endsWith('@wisc.edu')
}

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase()
}

export function isValidHandle(handle: string): boolean {
  const normalized = normalizeHandle(handle)
  return HANDLE_REGEX.test(normalized)
}

export function suggestHandleFromEmail(email: string): string {
  const normalizedEmail = normalizeEmail(email)
  const local = normalizedEmail.split('@')[0] || 'badger'
  const cleaned = local.replace(/[^a-z0-9._-]/gi, '').replace(/^[._-]+|[._-]+$/g, '')
  const fallback = cleaned.length >= 3 ? cleaned : `badger${Math.floor(Math.random() * 1000)}`
  return fallback.slice(0, 32).toLowerCase()
}

export async function resolveUniqueHandle(
  prisma: HandleLookupClient,
  desiredHandle: string
): Promise<string> {
  const base = normalizeHandle(desiredHandle)
  const seed = base.length > 0 ? base : 'badger'

  let candidate = seed.slice(0, 32)
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    if (suffix > 0) {
      const suffixStr = suffix.toString()
      const maxBaseLen = 32 - suffixStr.length
      candidate = `${seed.slice(0, Math.max(1, maxBaseLen))}${suffixStr}`
    }

    const exists = await prisma.user.findUnique({
      where: { loginHandleNormalized: candidate },
      select: { id: true },
    })
    if (!exists) return candidate
  }

  return `${seed.slice(0, 27)}${Date.now().toString().slice(-5)}`
}
