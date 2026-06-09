import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function toCategory(row: any) {
  return {
    id: row.id,
    categoryName: row.category_name,
    categorySort: row.category_sort,
    tag: row.tag,
  }
}

router.get('/', (req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM todo_categories WHERE app_user_id = ? ORDER BY category_sort, category_name').all(req.userId)
  res.json(rows.map(toCategory))
})

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const row = db.prepare('SELECT * FROM todo_categories WHERE id = ? AND app_user_id = ?').get(req.params.id, req.userId) as any
  if (!row) { res.status(404).json({ errors: ['Not found'] }); return }
  res.json(toCategory(row))
})

router.post('/', (req: AuthRequest, res: Response): void => {
  const { categoryName, categorySort = 0, tag = '' } = req.body
  if (!categoryName) { res.status(400).json({ errors: ['categoryName is required'] }); return }
  const id = uuidv4()
  db.prepare('INSERT INTO todo_categories (id, app_user_id, category_name, category_sort, tag) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.userId, categoryName, categorySort, tag)
  const row = db.prepare('SELECT * FROM todo_categories WHERE id = ?').get(id) as any
  res.status(201).json(toCategory(row))
})

router.put('/:id', (req: AuthRequest, res: Response): void => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM todo_categories WHERE id = ? AND app_user_id = ?').get(id, req.userId) as any
  if (!existing) { res.status(404).json({ errors: ['Not found'] }); return }
  const { categoryName = existing.category_name, categorySort = existing.category_sort, tag = existing.tag } = req.body
  db.prepare('UPDATE todo_categories SET category_name = ?, category_sort = ?, tag = ? WHERE id = ?')
    .run(categoryName, categorySort, tag, id)
  const row = db.prepare('SELECT * FROM todo_categories WHERE id = ?').get(id) as any
  res.json(toCategory(row))
})

router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT id FROM todo_categories WHERE id = ? AND app_user_id = ?').get(req.params.id, req.userId)
  if (!existing) { res.status(404).json({ errors: ['Not found'] }); return }
  db.prepare('DELETE FROM todo_categories WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
