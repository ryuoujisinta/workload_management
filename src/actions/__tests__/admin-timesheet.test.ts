import { getMonthlyUserTimesheet } from '../admin-timesheet'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    userTask: {
      findMany: jest.fn(),
    },
    workload: {
      findMany: jest.fn(),
    },
  },
}))

describe('getMonthlyUserTimesheet sorting', () => {
  const mockAuth = auth as jest.Mock
  const mockUserFindUnique = prisma.user.findUnique as jest.Mock
  const mockUserTaskFindMany = prisma.userTask.findMany as jest.Mock
  const mockWorkloadFindMany = prisma.workload.findMany as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { role: 'ADMIN' } })
    mockUserFindUnique.mockResolvedValue({ id: 'user1', name: 'Test User', email: 'test@example.com' })
  })

  it('sorts tasks by project name and then task name', async () => {
    // Mock userTasks in unsorted order
    mockUserTaskFindMany.mockResolvedValue([
      {
        task: {
          id: 'task1',
          name: 'B Task',
          project: { name: 'Z Project' }
        }
      },
      {
        task: {
          id: 'task2',
          name: 'A Task',
          project: { name: 'A Project' }
        }
      },
      {
        task: {
          id: 'task3',
          name: 'C Task',
          project: { name: 'A Project' }
        }
      }
    ])

    mockWorkloadFindMany.mockResolvedValue([])

    const result = await getMonthlyUserTimesheet('user1', '2023-10')

    expect(result.tasks).toEqual([
      { id: 'task2', name: 'A Task', projectName: 'A Project' },
      { id: 'task3', name: 'C Task', projectName: 'A Project' },
      { id: 'task1', name: 'B Task', projectName: 'Z Project' }
    ])
  })

  it('sorts combined tasks from userTasks and workloads correctly', async () => {
    mockUserTaskFindMany.mockResolvedValue([
      {
        task: {
          id: 'task-user',
          name: 'User Task',
          project: { name: 'Project B' }
        }
      }
    ])

    mockWorkloadFindMany.mockResolvedValue([
      {
        taskId: 'task-workload',
        date: new Date('2023-10-01'),
        hours: 1,
        status: 'APPROVED',
        task: {
          id: 'task-workload',
          name: 'Workload Task',
          project: { name: 'Project A' }
        }
      }
    ])

    const result = await getMonthlyUserTimesheet('user1', '2023-10')

    expect(result.tasks).toEqual([
      { id: 'task-workload', name: 'Workload Task', projectName: 'Project A' },
      { id: 'task-user', name: 'User Task', projectName: 'Project B' }
    ])
  })
})
