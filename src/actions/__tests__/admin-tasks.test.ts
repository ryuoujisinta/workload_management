import { createTask, deleteTask, toggleMonthlyTask } from '../admin-tasks'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    monthlyTask: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

describe('admin-tasks', () => {
  const mockAuth = auth as jest.Mock
  const mockRevalidatePath = revalidatePath as jest.Mock
  const mockCreate = prisma.task.create as jest.Mock
  const mockDelete = prisma.task.delete as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTask', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      const formData = new FormData()
      await expect(createTask(formData)).rejects.toThrow('Unauthorized')
    })

    it('throws Invalid data error if missing fields', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      const formData = new FormData()
      formData.append('projectId', 'proj-123')
      // missing name

      await expect(createTask(formData)).rejects.toThrow('Invalid data')
    })

    it('creates task and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      const formData = new FormData()
      formData.append('projectId', 'proj-123')
      formData.append('name', 'Test Task')

      mockCreate.mockResolvedValueOnce({ id: '123', projectId: 'proj-123', name: 'Test Task' })

      await createTask(formData)

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-123',
          name: 'Test Task',
        }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tasks')
    })
  })

  describe('deleteTask', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      await expect(deleteTask('123')).rejects.toThrow('Unauthorized')
    })

    it('deletes task and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      mockDelete.mockResolvedValueOnce({ id: '123' })

      await deleteTask('123')

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: '123' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tasks')
    })
  })

  describe('toggleMonthlyTask', () => {
    const mockUpsert = prisma.monthlyTask.upsert as jest.Mock
    const mockDeleteMany = prisma.monthlyTask.deleteMany as jest.Mock

    it('upserts monthly task when isActive is true', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      await toggleMonthlyTask('task-123', '2024-03', true)

      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          taskId_targetMonth: { taskId: 'task-123', targetMonth: '2024-03' }
        },
        update: {},
        create: { taskId: 'task-123', targetMonth: '2024-03' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tasks')
    })

    it('deletes monthly task when isActive is false', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      await toggleMonthlyTask('task-123', '2024-03', false)

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { taskId: 'task-123', targetMonth: '2024-03' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tasks')
    })
  })
})
