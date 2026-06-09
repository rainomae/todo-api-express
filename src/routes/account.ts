import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'

const router = Router()
const JWT_SECRET = () => process.env.JWT_SECRET || 'changeme'
const JWT_EXPIRES = '1h'

function makeTokens(userId: string, firstName: string, lastName: string) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET(), { expiresIn: JWT_EXPIRES })
  const refreshToken = uuidv4()
  db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?').run(refreshToken, userId)
  return { token, refreshToken, firstName, lastName }
}

router.post('/Login', (req: Request, res: Response): void => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ errors: ['Email and password are required'] })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ errors: ['Invalid email or password'] })
    return
  }

  res.json(makeTokens(user.id, user.first_name, user.last_name))
})

router.post('/Register', (req: Request, res: Response): void => {
  const { email, password, firstName, lastName } = req.body
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ errors: ['All fields are required'] })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(400).json({ errors: ['Email is already taken'] })
    return
  }

  const id = uuidv4()
  const passwordHash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)')
    .run(id, email, passwordHash, firstName, lastName)

  res.status(201).json(makeTokens(id, firstName, lastName))
})

router.post('/RefreshToken', (req: Request, res: Response): void => {
  const { jwt: token, refreshToken } = req.body
  if (!token || !refreshToken) {
    res.status(400).json({ errors: ['jwt and refreshToken are required'] })
    return
  }

  let userId: string
  try {
    const payload = jwt.verify(token, JWT_SECRET(), { ignoreExpiration: true }) as { sub: string }
    userId = payload.sub
  } catch {
    res.status(401).json({ errors: ['Invalid token'] })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ? AND refresh_token = ?').get(userId, refreshToken) as any
  if (!user) {
    res.status(401).json({ errors: ['Invalid refresh token'] })
    return
  }

  res.json(makeTokens(user.id, user.first_name, user.last_name))
})

export default router
