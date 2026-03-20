import { approveWorkloads, rejectWorkloads, revokeApproval } from '../admin-approvals'
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

describe('admin-approvals Server Actions', () => {
  const mockAuth = auth as jest.Mock
  const mockRevalidatePath = revalidatePath as jest.Mock
  const mockUpdateMany = prisma.workload.updateMany as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('approveWorkloads', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      await expect(approveWorkloads('user1', '2023-10-15')).rejects.toThrow('Unauthorized')
    })

    it('updates status to APPROVED and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      mockUpdateMany.mockResolvedValueOnce({ count: 1 })

      await approveWorkloads('user1', '2023-10-15')

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', date: new Date('2023-10-15'), status: 'PENDING' },
        data: { status: 'APPROVED' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/approvals')
    })
  })

  describe('rejectWorkloads', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      await expect(rejectWorkloads('user1', '2023-10-15')).rejects.toThrow('Unauthorized')
    })

    it('updates status to REJECTED and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      mockUpdateMany.mockResolvedValueOnce({ count: 1 })

      await rejectWorkloads('user1', '2023-10-15')

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', date: new Date('2023-10-15'), status: 'PENDING' },
        data: { status: 'REJECTED' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/approvals')
    })
  })

  describe('revokeApproval', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      await expect(revokeApproval('user1', '2023-10-15')).rejects.toThrow('Unauthorized')
    })

    it('updates status to DRAFT and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      mockUpdateMany.mockResolvedValueOnce({ count: 1 })

      await revokeApproval('user1', '2023-10-15')

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', date: new Date('2023-10-15'), status: 'APPROVED' },
        data: { status: 'DRAFT' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/approvals')
    })
  })
})
