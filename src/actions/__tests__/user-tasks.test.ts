import { addUserTask, removeUserTask } from '../user-tasks'
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

describe('user-tasks Server Actions', () => {
  const mockAuth = auth as jest.Mock
  const mockRevalidatePath = revalidatePath as jest.Mock
  const mockCreate = prisma.userTask.create as jest.Mock
  const mockDelete = prisma.userTask.delete as jest.Mock
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('addUserTask', () => {
    it('throws Unauthorized error if no user id', async () => {
      mockAuth.mockResolvedValueOnce({ user: {} })
      
      await expect(addUserTask('task1')).rejects.toThrow('Unauthorized')
    })

    it('creates userTask and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } })
      mockCreate.mockResolvedValueOnce({ userId: 'user1', taskId: 'task1' })

      await addUserTask('task1')

      expect(mockCreate).toHaveBeenCalledWith({
        data: { userId: 'user1', taskId: 'task1' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/user/tasks')
    })

    it('catches and logs error (e.g., unique constraint) without throwing to client', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } })
      mockCreate.mockRejectedValueOnce(new Error('Unique constraint failed'))

      await expect(addUserTask('task1')).resolves.toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error))
      // should not revalidate if errored
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('removeUserTask', () => {
    it('throws Unauthorized error if no user id', async () => {
      mockAuth.mockResolvedValueOnce({ user: {} })
      
      await expect(removeUserTask('task1')).rejects.toThrow('Unauthorized')
    })

    it('deletes userTask and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } })
      mockDelete.mockResolvedValueOnce({ userId: 'user1', taskId: 'task1' })

      await removeUserTask('task1')

      expect(mockDelete).toHaveBeenCalledWith({
        where: { userId_taskId: { userId: 'user1', taskId: 'task1' } }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/user/tasks')
    })

    it('catches and logs error without throwing to client', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } })
      mockDelete.mockRejectedValueOnce(new Error('Record not found'))

      await expect(removeUserTask('task1')).resolves.toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })
})
