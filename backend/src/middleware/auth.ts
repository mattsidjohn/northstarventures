import { Request, Response, NextFunction } from 'express'
import { validateToken } from '../lib/supabase'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string
      userToken: string
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.slice(7)
  const userId = await validateToken(token)

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  req.userId = userId
  req.userToken = token
  next()
}
