import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TimesheetTable from '../timesheet-table'
import { saveWorkload, submitDay, cancelSubmitDay } from '@/actions/timesheet'

jest.mock('@/actions/timesheet', () => ({
  saveWorkload: jest.fn(),
  submitDay: jest.fn(),
  cancelSubmitDay: jest.fn(),
}))

describe('TimesheetTable', () => {
  const mockSave = saveWorkload as jest.Mock
  const mockSubmit = submitDay as jest.Mock
  const mockCancel = cancelSubmitDay as jest.Mock

  const tasks: any[] = [
    { id: 't1', name: 'Task 1', project: { name: 'Proj A' } }
  ]
  const dates = ['2023-10-15', '2023-10-16']

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders tasks and dates correctly', () => {
    render(<TimesheetTable tasks={tasks} dates={dates} initialWorkloads={[]} targetMonth="2023-10" />)
    
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('[Proj A]')).toBeInTheDocument()
    // Should render input boxes for each date
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs).toHaveLength(2)
  })

  it('shows APPROVED status and disables inputs if workload is approved', () => {
    const workloads = [
      { id: 'w1', userId: 'u1', taskId: 't1', date: new Date('2023-10-15T00:00:00Z'), hours: 4, status: 'APPROVED' }
    ]
    render(<TimesheetTable tasks={tasks} dates={dates} initialWorkloads={workloads as any} targetMonth="2023-10" />)
    
    // For 2023-10-15 it's APPROVED
    expect(screen.getByText('承認済')).toBeInTheDocument()
    
    // First input should be disabled
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toBeDisabled()
    expect((inputs[0] as HTMLInputElement).value).toBe('4')
    
    // Second input (2023-10-16) should be enabled
    expect(inputs[1]).not.toBeDisabled()
  })

  it('calls saveWorkload when "保存" button is clicked', async () => {
    render(<TimesheetTable tasks={tasks} dates={dates} initialWorkloads={[]} targetMonth="2023-10" />)
    
    // Change value
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '5' } })
    
    // Click 保存 for the first date
    const saveButtons = screen.getAllByRole('button', { name: '保存' })
    fireEvent.click(saveButtons[0])

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith([{ taskId: 't1', date: '2023-10-15', hours: 5 }])
    })
  })
})
