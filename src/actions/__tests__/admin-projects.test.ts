import { createProject, deleteProject } from '../admin-projects'
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

describe('admin-projects', () => {
  const mockAuth = auth as jest.Mock
  const mockRevalidatePath = revalidatePath as jest.Mock
  const mockCreate = prisma.project.create as jest.Mock
  const mockDelete = prisma.project.delete as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createProject', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      const formData = new FormData()
      await expect(createProject(formData)).rejects.toThrow('Unauthorized')
    })

    it('throws Invalid data error if missing name', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      const formData = new FormData()
      // missing name

      await expect(createProject(formData)).rejects.toThrow('Invalid data')
    })

    it('creates project and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      const formData = new FormData()
      formData.append('name', 'Test Project')

      mockCreate.mockResolvedValueOnce({ id: 'proj-1', name: 'Test Project' })

      await createProject(formData)

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: 'Test Project',
        }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tasks')
    })
  })

  describe('deleteProject', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      await expect(deleteProject('proj-1')).rejects.toThrow('Unauthorized')
    })

    it('deletes project and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      mockDelete.mockResolvedValueOnce({ id: 'proj-1' })

      await deleteProject('proj-1')

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: 'proj-1' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tasks')
    })
  })
})
