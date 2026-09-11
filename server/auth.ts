import type { CookieOptions, NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const COOKIE = 'circular_token'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function secret(): string {
  const value = process.env.JWT_SECRET
  if (!value) throw new Error('JWT_SECRET is not set')
  return value
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK_MS,
    path: '/',
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: '7d' })
}

export function setSession(res: Response, userId: string): void {
  res.cookie(COOKIE, signToken(userId), cookieOptions())
}

export function clearSession(res: Response): void {
  res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: 0 })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE]
  if (!token || typeof token !== 'string') {
    res.status(401).json({ error: 'Sign in required' })
    return
  }
  try {
    const payload = jwt.verify(token, secret())
    if (typeof payload !== 'object' || !payload.sub || typeof payload.sub !== 'string') {
      res.status(401).json({ error: 'Session expired' })
      return
    }
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Session expired' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE]
  if (!token || typeof token !== 'string') {
    next()
    return
  }
  try {
    const payload = jwt.verify(token, secret())
    if (typeof payload === 'object' && payload.sub && typeof payload.sub === 'string') {
      req.userId = payload.sub
    }
  } catch {
    /* ignore invalid token */
  }
  next()
}
