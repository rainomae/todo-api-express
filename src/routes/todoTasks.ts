import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function toTask(row: any) {
  return {
    id: row.id,
    taskName: row.task_name,
    taskSort: row.task_sort,
    isCompleted: row.is_completed === 1,
    isArchived: row.is_archived === 1,
    dueDt: row.due_dt ?? null,
    createdDt: row.created_dt,
    todoCategoryId: row.todo_category_id ?? null,
    todoPriorityId: row.todo_priority_id ?? null,
  }
}

router.get('/', (req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM todo_tasks WHERE app_user_id = ? ORDER BY task_sort, created_dt').all(req.userId)
  res.json(rows.map(toTask))
})

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const row = db.prepare('SELECT * FROM todo_tasks WHERE id = ? AND app_user_id = ?').get(req.params.id, req.userId) as any
  if (!row) { res.status(404).json({ errors: ['Not found'] }); return }
  res.json(toTask(row))
})

// ===== UUS LAHENDUS: üks PUT /TodoTasks/reorder kogu järjestuse kohta =====
router.put('/reorder', (req: AuthRequest, res: Response): void => {
  const items = req.body as unknown
  const valid = Array.isArray(items)
    && items.every((i) => i && typeof i.id === 'string' && Number.isInteger(i.taskSort))
  if (!valid) { res.status(400).json({ errors: ['Body must be an array of { id, taskSort }'] }); return }

  const update = db.prepare('UPDATE todo_tasks SET task_sort = ? WHERE id = ? AND app_user_id = ?')
  const applyAll = db.transaction((rows: { id: string; taskSort: number }[]) => {
    let updated = 0
    for (const r of rows) updated += update.run(r.taskSort, r.id, req.userId).changes
    return updated
  })

  res.json({ updated: applyAll(items as { id: string; taskSort: number }[]) })
})
// ===== UUS LAHENDUS LÕPP =====

router.post('/', (req: AuthRequest, res: Response): void => {
  const {
    taskName,
    taskSort = 0,
    isCompleted = false,
    isArchived = false,
    dueDt = null,
    todoCategoryId = null,
    todoPriorityId = null,
  } = req.body

  if (!taskName) { res.status(400).json({ errors: ['taskName is required'] }); return }

  if (todoCategoryId) {
    const cat = db.prepare('SELECT 1 FROM todo_categories WHERE id = ? AND app_user_id = ?').get(todoCategoryId, req.userId)
    if (!cat) { res.status(400).json({ errors: ['Invalid todoCategoryId'] }); return }
  }
  if (todoPriorityId) {
    const pri = db.prepare('SELECT 1 FROM todo_priorities WHERE id = ? AND app_user_id = ?').get(todoPriorityId, req.userId)
    if (!pri) { res.status(400).json({ errors: ['Invalid todoPriorityId'] }); return }
  }

  const id = uuidv4()
  const createdDt = new Date().toISOString()

  db.prepare(`
    INSERT INTO todo_tasks (id, app_user_id, task_name, task_sort, is_completed, is_archived, due_dt, created_dt, todo_category_id, todo_priority_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, taskName, taskSort, isCompleted ? 1 : 0, isArchived ? 1 : 0, dueDt, createdDt, todoCategoryId, todoPriorityId)

  const row = db.prepare('SELECT * FROM todo_tasks WHERE id = ?').get(id) as any
  res.status(201).json(toTask(row))
})

router.put('/:id', (req: AuthRequest, res: Response): void => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM todo_tasks WHERE id = ? AND app_user_id = ?').get(id, req.userId) as any
  if (!existing) { res.status(404).json({ errors: ['Not found'] }); return }

  const taskName = req.body.taskName ?? existing.task_name
  const taskSort = req.body.taskSort ?? existing.task_sort
  const isCompleted = req.body.isCompleted !== undefined ? (req.body.isCompleted ? 1 : 0) : existing.is_completed
  const isArchived = req.body.isArchived !== undefined ? (req.body.isArchived ? 1 : 0) : existing.is_archived
  const dueDt = 'dueDt' in req.body ? req.body.dueDt : existing.due_dt
  const todoCategoryId = 'todoCategoryId' in req.body ? req.body.todoCategoryId : existing.todo_category_id
  const todoPriorityId = 'todoPriorityId' in req.body ? req.body.todoPriorityId : existing.todo_priority_id

  if ('todoCategoryId' in req.body && todoCategoryId) {
    const cat = db.prepare('SELECT 1 FROM todo_categories WHERE id = ? AND app_user_id = ?').get(todoCategoryId, req.userId)
    if (!cat) { res.status(400).json({ errors: ['Invalid todoCategoryId'] }); return }
  }
  if ('todoPriorityId' in req.body && todoPriorityId) {
    const pri = db.prepare('SELECT 1 FROM todo_priorities WHERE id = ? AND app_user_id = ?').get(todoPriorityId, req.userId)
    if (!pri) { res.status(400).json({ errors: ['Invalid todoPriorityId'] }); return }
  }

  db.prepare(`
    UPDATE todo_tasks
    SET task_name = ?, task_sort = ?, is_completed = ?, is_archived = ?, due_dt = ?, todo_category_id = ?, todo_priority_id = ?
    WHERE id = ?
  `).run(taskName, taskSort, isCompleted, isArchived, dueDt, todoCategoryId, todoPriorityId, id)

  const row = db.prepare('SELECT * FROM todo_tasks WHERE id = ?').get(id) as any
  res.json(toTask(row))
})

router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT id FROM todo_tasks WHERE id = ? AND app_user_id = ?').get(req.params.id, req.userId)
  if (!existing) { res.status(404).json({ errors: ['Not found'] }); return }
  db.prepare('DELETE FROM todo_tasks WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
