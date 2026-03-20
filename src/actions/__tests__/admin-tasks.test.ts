import { createTask, deleteTask } from '../admin-tasks'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma')

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
      formData.append('project', 'Proj')
      // missing name and targetMonth

      await expect(createTask(formData)).rejects.toThrow('Invalid data')
    })

    it('creates task and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      const formData = new FormData()
      formData.append('project', 'Test Proj')
      formData.append('name', 'Test Task')
      formData.append('targetMonth', '2024-03')

      mockCreate.mockResolvedValueOnce({ id: '123', project: 'Test Proj', name: 'Test Task', targetMonth: '2024-03' })

      await createTask(formData)

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          project: 'Test Proj',
          name: 'Test Task',
          targetMonth: '2024-03'
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
})
