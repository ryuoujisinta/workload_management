import { createUser, deleteUser } from '../admin-users'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma')

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
}))

describe('admin-users Server Actions', () => {
  const mockAuth = auth as jest.Mock
  const mockRevalidatePath = revalidatePath as jest.Mock
  const mockCreate = prisma.user.create as jest.Mock
  const mockDelete = prisma.user.delete as jest.Mock
  const mockHash = bcrypt.hash as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUser', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      const formData = new FormData()
      await expect(createUser(formData)).rejects.toThrow('Unauthorized')
    })

    it('throws Invalid data error if missing fields', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      const formData = new FormData()
      formData.append('name', 'John')
      // missing email and role

      await expect(createUser(formData)).rejects.toThrow('Invalid data')
    })

    it('creates user, hashes password, and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      
      const formData = new FormData()
      formData.append('name', 'John Doe')
      formData.append('email', 'john@example.com')
      formData.append('role', 'USER')

      mockCreate.mockResolvedValueOnce({ 
        id: 'user1', 
        name: 'John Doe', 
        email: 'john@example.com', 
        role: 'USER' 
      })

      await createUser(formData)

      expect(mockHash).toHaveBeenCalledWith('password123', 10)
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
          passwordHash: 'hashedpassword'
        }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users')
    })
  })

  describe('deleteUser', () => {
    it('throws Unauthorized error if user is not ADMIN', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'USER' } })
      
      await expect(deleteUser('user1')).rejects.toThrow('Unauthorized')
    })

    it('deletes user and revalidates path on success', async () => {
      mockAuth.mockResolvedValueOnce({ user: { role: 'ADMIN' } })
      mockDelete.mockResolvedValueOnce({ id: 'user1' })

      await deleteUser('user1')

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: 'user1' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users')
    })
  })
})
