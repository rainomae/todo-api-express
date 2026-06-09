import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import accountRouter from './routes/account'
import todoCategoriesRouter from './routes/todoCategories'
import todoPrioritiesRouter from './routes/todoPriorities'
import todoTasksRouter from './routes/todoTasks'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => res.json({
  name: 'Todo API',
  version: '1.0.0',
  endpoints: {
    health: '/api/v1/health',
    login: 'POST /api/v1/Account/Login',
    register: 'POST /api/v1/Account/Register',
    refreshToken: 'POST /api/v1/Account/RefreshToken',
    todoTasks: '/api/v1/TodoTasks',
    todoCategories: '/api/v1/TodoCategories',
    todoPriorities: '/api/v1/TodoPriorities',
  }
}))

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/v1/Account', accountRouter)
app.use('/api/v1/TodoCategories', todoCategoriesRouter)
app.use('/api/v1/TodoPriorities', todoPrioritiesRouter)
app.use('/api/v1/TodoTasks', todoTasksRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
