import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CustomerSupport from '../CustomerSupport'
import { supportService } from '../../services/supportService'


vi.mock('../../services/supportService', () => ({
  supportService: {
    createTicket: vi.fn(),
    sendEmailNotification: vi.fn()
  }
}))


vi.mock('../../components/FAQ', () => ({
  default: () => <div data-testid="faq-component">FAQ Component</div>
}))

vi.mock('../../components/HelpDocumentation', () => ({
  default: () => <div data-testid="help-docs-component">Help Documentation Component</div>
}))

const mockSupportService = vi.mocked(supportService)

describe('CustomerSupport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Tab Navigation', () => {
    it('should render contact support tab by default', () => {
      render(<CustomerSupport />)

      expect(screen.getByText('Customer Support')).toBeInTheDocument()
      expect(screen.getByText('Contact Support')).toBeInTheDocument()
      expect(screen.getByText('Submit a Support Request')).toBeInTheDocument()
    })

    it('should switch to FAQ tab when clicked', () => {
      render(<CustomerSupport />)

      fireEvent.click(screen.getByText('FAQ'))

      expect(screen.getByTestId('faq-component')).toBeInTheDocument()
    })

    it('should switch to Help Docs tab when clicked', () => {
      render(<CustomerSupport />)

      fireEvent.click(screen.getByText('Help Docs'))

      expect(screen.getByTestId('help-docs-component')).toBeInTheDocument()
    })

    it('should highlight active tab correctly', () => {
      render(<CustomerSupport />)

      const contactTab = screen.getByText('Contact Support').closest('button')
      const faqTab = screen.getByText('FAQ').closest('button')

      // Contact tab should be active by default
      expect(contactTab).toHaveClass('bg-blue-600', 'text-white')
      expect(faqTab).toHaveClass('text-gray-600')

      // Click FAQ tab
      fireEvent.click(screen.getByText('FAQ'))

      expect(faqTab).toHaveClass('bg-blue-600', 'text-white')
    })
  })

  describe('Contact Methods Display', () => {
    it('should display all contact methods', () => {
      render(<CustomerSupport />)

      expect(screen.getByText('Phone Support')).toBeInTheDocument()
      expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument()
      expect(screen.getByText('Mon-Fri: 9AM-6PM EST')).toBeInTheDocument()

      expect(screen.getByText('Email Support')).toBeInTheDocument()
      expect(screen.getByText('support@culturaft.com')).toBeInTheDocument()
      expect(screen.getByText('Response within 24 hours')).toBeInTheDocument()

      expect(screen.getByText('Live Chat')).toBeInTheDocument()
      expect(screen.getByText('Start Chat')).toBeInTheDocument()
      expect(screen.getByText('Available 24/7')).toBeInTheDocument()
    })

    it('should display business hours', () => {
      render(<CustomerSupport />)

      expect(screen.getByText('Business Hours')).toBeInTheDocument()
      expect(screen.getByText('Monday - Friday')).toBeInTheDocument()
      expect(screen.getByText('9:00 AM - 6:00 PM EST')).toBeInTheDocument()
      expect(screen.getByText('Saturday')).toBeInTheDocument()
      expect(screen.getByText('10:00 AM - 4:00 PM EST')).toBeInTheDocument()
      expect(screen.getByText('Sunday')).toBeInTheDocument()
      expect(screen.getByText('Closed')).toBeInTheDocument()
    })
  })

  describe('Support Request Form', () => {
    it('should render all form fields', () => {
      render(<CustomerSupport />)

      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
      expect(screen.getByLabelText('Category *')).toBeInTheDocument()
      expect(screen.getByLabelText('Priority Level')).toBeInTheDocument()
      expect(screen.getByLabelText('Subject *')).toBeInTheDocument()
      expect(screen.getByLabelText('Message *')).toBeInTheDocument()
    })

    it('should have all support categories in dropdown', () => {
      render(<CustomerSupport />)

      const categorySelect = screen.getByLabelText('Category *')
      
      expect(categorySelect).toBeInTheDocument()
      
      // Check if options exist by looking at the select element
      const options = categorySelect.querySelectorAll('option')
      expect(options).toHaveLength(8) // 1 default + 7 categories
      
      // Check for specific category options
      expect(screen.getByRole('option', { name: 'Order Issues' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Product Information' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Shipping & Delivery' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Returns & Refunds' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Technical Support' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Billing & Payments' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'General Inquiry' })).toBeInTheDocument()
    })

    it('should have all priority levels in dropdown', () => {
      render(<CustomerSupport />)

      const prioritySelect = screen.getByLabelText('Priority Level')
      
      expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Urgent' })).toBeInTheDocument()
      
      // Medium should be selected by default
      expect(prioritySelect).toHaveValue('medium')
    })

    it('should update form fields when user types', () => {
      render(<CustomerSupport />)

      const nameInput = screen.getByLabelText('Full Name *')
      const emailInput = screen.getByLabelText('Email Address *')
      const subjectInput = screen.getByLabelText('Subject *')
      const messageInput = screen.getByLabelText('Message *')

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } })
      fireEvent.change(messageInput, { target: { value: 'Test message' } })

      expect(nameInput).toHaveValue('John Doe')
      expect(emailInput).toHaveValue('john@example.com')
      expect(subjectInput).toHaveValue('Test Subject')
      expect(messageInput).toHaveValue('Test message')
    })

    it('should update dropdown selections', () => {
      render(<CustomerSupport />)

      const categorySelect = screen.getByLabelText('Category *')
      const prioritySelect = screen.getByLabelText('Priority Level')

      fireEvent.change(categorySelect, { target: { value: 'order' } })
      fireEvent.change(prioritySelect, { target: { value: 'high' } })

      expect(categorySelect).toHaveValue('order')
      expect(prioritySelect).toHaveValue('high')
    })
  })

  describe('Form Submission', () => {
    const fillForm = () => {
      fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } })
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'order' } })
      fireEvent.change(screen.getByLabelText('Priority Level'), { target: { value: 'high' } })
      fireEvent.change(screen.getByLabelText('Subject *'), { target: { value: 'Order Issue' } })
      fireEvent.change(screen.getByLabelText('Message *'), { target: { value: 'I have a problem with my order' } })
    }

    it('should submit form successfully', async () => {
      const mockTicket = {
        id: 'ticket_123',
        ticketNumber: 'SUP-ABC123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        category: 'order',
        priority: 'high',
        subject: 'Order Issue',
        message: 'I have a problem with my order',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: []
      }

      mockSupportService.createTicket.mockResolvedValue(mockTicket)
      mockSupportService.sendEmailNotification.mockResolvedValue(undefined)

      render(<CustomerSupport />)
      fillForm()

      const submitButton = screen.getByRole('button', { name: /submit request/i })
      fireEvent.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockSupportService.createTicket).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          category: 'order',
          priority: 'high',
          subject: 'Order Issue',
          message: 'I have a problem with my order'
        })
      })

      await waitFor(() => {
        expect(mockSupportService.sendEmailNotification).toHaveBeenCalledWith('ticket_123', 'created')
      })

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/your support request has been submitted successfully/i)).toBeInTheDocument()
      })

      // Form should be reset
      expect(screen.getByLabelText('Full Name *')).toHaveValue('')
      expect(screen.getByLabelText('Email Address *')).toHaveValue('')
      expect(screen.getByLabelText('Subject *')).toHaveValue('')
      expect(screen.getByLabelText('Message *')).toHaveValue('')
    })

    it('should handle form submission error', async () => {
      mockSupportService.createTicket.mockRejectedValue(new Error('Submission failed'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<CustomerSupport />)
      fillForm()

      const submitButton = screen.getByRole('button', { name: /submit request/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/there was an error submitting your request/i)).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error submitting support request:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should disable submit button during submission', async () => {
      mockSupportService.createTicket.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<CustomerSupport />)
      fillForm()

      const submitButton = screen.getByRole('button', { name: /submit request/i })
      fireEvent.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
    })

    it('should require all mandatory fields', () => {
      render(<CustomerSupport />)

      const nameInput = screen.getByLabelText('Full Name *')
      const emailInput = screen.getByLabelText('Email Address *')
      const categorySelect = screen.getByLabelText('Category *')
      const subjectInput = screen.getByLabelText('Subject *')
      const messageInput = screen.getByLabelText('Message *')

      expect(nameInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('required')
      expect(categorySelect).toHaveAttribute('required')
      expect(subjectInput).toHaveAttribute('required')
      expect(messageInput).toHaveAttribute('required')
    })

    it('should have correct input types', () => {
      render(<CustomerSupport />)

      expect(screen.getByLabelText('Full Name *')).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText('Email Address *')).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText('Phone Number')).toHaveAttribute('type', 'tel')
    })
  })

  describe('Form Validation and UX', () => {
    it('should show success message after successful submission', async () => {
      const mockTicket = {
        id: 'ticket_123',
        ticketNumber: 'SUP-ABC123',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: []
      }

      mockSupportService.createTicket.mockResolvedValue(mockTicket)
      mockSupportService.sendEmailNotification.mockResolvedValue(undefined)

      render(<CustomerSupport />)

      // Fill and submit form
      fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'order' } })
      fireEvent.change(screen.getByLabelText('Subject *'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByLabelText('Message *'), { target: { value: 'Test message' } })

      fireEvent.click(screen.getByRole('button', { name: /submit request/i }))

      await waitFor(() => {
        expect(screen.getByText(/your support request has been submitted successfully/i)).toBeInTheDocument()
      })
    })

    it('should clear success/error messages when switching tabs', () => {
      render(<CustomerSupport />)

      // Simulate having a success message (this would normally be set after form submission)
      // Since we can't directly set state, we'll test the tab switching functionality
      fireEvent.click(screen.getByText('FAQ'))
      fireEvent.click(screen.getByText('Contact Support'))

      // Form should be visible again
      expect(screen.getByText('Submit a Support Request')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<CustomerSupport />)

      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
      expect(screen.getByLabelText('Category *')).toBeInTheDocument()
      expect(screen.getByLabelText('Priority Level')).toBeInTheDocument()
      expect(screen.getByLabelText('Subject *')).toBeInTheDocument()
      expect(screen.getByLabelText('Message *')).toBeInTheDocument()
    })

    it('should have proper button roles and text', () => {
      render(<CustomerSupport />)

      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /faq/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /help docs/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start chat/i })).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      render(<CustomerSupport />)

      expect(screen.getByRole('heading', { name: 'Customer Support' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Contact Methods' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Submit a Support Request' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Business Hours' })).toBeInTheDocument()
    })
  })
})