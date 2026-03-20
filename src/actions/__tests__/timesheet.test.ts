import { saveWorkload, submitDay, cancelSubmitDay } from '../timesheet'
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

describe('timesheet Server Actions', () => {
  const mockAuth = auth as jest.Mock
  const mockRevalidatePath = revalidatePath as jest.Mock
  const mockUpsert = prisma.workload.upsert as jest.Mock
  const mockUpdateMany = prisma.workload.updateMany as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveWorkload', () => {
    it('throws Unauthorized error if no user id', async () => {
      mockAuth.mockResolvedValueOnce({ user: {} })
      
      await expect(saveWorkload([])).rejects.toThrow('Unauthorized')
    })

    it('upserts multiple workload entries and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } })
      mockUpsert.mockResolvedValue({ id: 'workload1' })

      const entries = [
        { taskId: 'task1', date: '2023-10-15', hours: 4 },
        { taskId: 'task2', date: '2023-10-15', hours: 3 }
      ]

      await saveWorkload(entries)

      expect(mockUpsert).toHaveBeenCalledTimes(2)
      
      const dateObj = new Date('2023-10-15')
      
      expect(mockUpsert).toHaveBeenNthCalledWith(1, {
        where: { userId_taskId_date: { userId: 'user1', taskId: 'task1', date: dateObj } },
        update: { hours: 4 },
        create: { userId: 'user1', taskId: 'task1', date: dateObj, hours: 4, status: 'DRAFT' }
      })

      expect(mockUpsert).toHaveBeenNthCalledWith(2, {
        where: { userId_taskId_date: { userId: 'user1', taskId: 'task2', date: dateObj } },
        update: { hours: 3 },
        create: { userId: 'user1', taskId: 'task2', date: dateObj, hours: 3, status: 'DRAFT' }
      })

      expect(mockRevalidatePath).toHaveBeenCalledWith('/user/timesheet')
    })
  })

  describe('submitDay', () => {
    it('throws Unauthorized error if no user id', async () => {
      mockAuth.mockResolvedValueOnce({ user: {} })
      
      await expect(submitDay('2023-10-15')).rejects.toThrow('Unauthorized')
    })

    it('updates status to PENDING and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } })
      mockUpdateMany.mockResolvedValueOnce({ count: 2 })

      await submitDay('2023-10-15')

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user1', 
          date: new Date('2023-10-15'),
          status: { in: ['DRAFT', 'REJECTED'] }
        },
        data: { status: 'PENDING' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/user/timesheet')
    })
  })

  describe('cancelSubmitDay', () => {
    it('throws Unauthorized error if no user id', async () => {
      mockAuth.mockResolvedValueOnce({ user: {} })
      
      await expect(cancelSubmitDay('2023-10-15')).rejects.toThrow('Unauthorized')
    })

    it('updates status to DRAFT and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } })
      mockUpdateMany.mockResolvedValueOnce({ count: 2 })

      await cancelSubmitDay('2023-10-15')

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user1', 
          date: new Date('2023-10-15'),
          status: 'PENDING'
        },
        data: { status: 'DRAFT' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/user/timesheet')
    })
  })
})
