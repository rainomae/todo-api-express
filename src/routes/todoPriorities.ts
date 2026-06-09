import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function toPriority(row: any) {
  return {
    id: row.id,
    priorityName: row.priority_name,
    prioritySort: row.priority_sort,
  }
}

router.get('/', (req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM todo_priorities WHERE app_user_id = ? ORDER BY priority_sort, priority_name').all(req.userId)
  res.json(rows.map(toPriority))
})

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const row = db.prepare('SELECT * FROM todo_priorities WHERE id = ? AND app_user_id = ?').get(req.params.id, req.userId) as any
  if (!row) { res.status(404).json({ errors: ['Not found'] }); return }
  res.json(toPriority(row))
})

router.post('/', (req: AuthRequest, res: Response): void => {
  const { priorityName, prioritySort = 0 } = req.body
  if (!priorityName) { res.status(400).json({ errors: ['priorityName is required'] }); return }
  const id = uuidv4()
  db.prepare('INSERT INTO todo_priorities (id, app_user_id, priority_name, priority_sort) VALUES (?, ?, ?, ?)')
    .run(id, req.userId, priorityName, prioritySort)
  const row = db.prepare('SELECT * FROM todo_priorities WHERE id = ?').get(id) as any
  res.status(201).json(toPriority(row))
})

router.put('/:id', (req: AuthRequest, res: Response): void => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM todo_priorities WHERE id = ? AND app_user_id = ?').get(id, req.userId) as any
  if (!existing) { res.status(404).json({ errors: ['Not found'] }); return }
  const { priorityName = existing.priority_name, prioritySort = existing.priority_sort } = req.body
  db.prepare('UPDATE todo_priorities SET priority_name = ?, priority_sort = ? WHERE id = ?')
    .run(priorityName, prioritySort, id)
  const row = db.prepare('SELECT * FROM todo_priorities WHERE id = ?').get(id) as any
  res.json(toPriority(row))
})

router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT id FROM todo_priorities WHERE id = ? AND app_user_id = ?').get(req.params.id, req.userId)
  if (!existing) { res.status(404).json({ errors: ['Not found'] }); return }
  db.prepare('DELETE FROM todo_priorities WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
