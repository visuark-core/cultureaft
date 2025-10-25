import { SupportTicket, SupportFormData, SupportResponse, SupportStats } from '../types/support';
import config from '../config/environment';

class SupportService {
  private baseUrl = config.apiBaseUrl;

  // Create a new support ticket
  async createTicket(formData: SupportFormData): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create support ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating support ticket:', error);
      
      // Fallback: Create a mock ticket for development
      const mockTicket: SupportTicket = {
        id: `ticket_${Date.now()}`,
        ticketNumber: `SUP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        category: formData.category as any,
        priority: formData.priority,
        subject: formData.subject,
        message: formData.message,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: []
      };

      // Store in localStorage for development
      this.storeTicketLocally(mockTicket);
      return mockTicket;
    }
  }

  // Get all tickets (admin only)
  async getAllTickets(): Promise<SupportTicket[]> {
    try {
      const response = await fetch(`${this.baseUrl}/support/tickets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tickets:', error);
      
      // Fallback: Return mock tickets from localStorage
      return this.getLocalTickets();
    }
  }

  // Get tickets by user email
  async getTicketsByEmail(email: string): Promise<SupportTicket[]> {
    try {
      const response = await fetch(`${this.baseUrl}/support/tickets/user/${email}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      
      // Fallback: Filter local tickets by email
      const allTickets = this.getLocalTickets();
      return allTickets.filter(ticket => ticket.email === email);
    }
  }

  // Get a specific ticket by ID
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    try {
      const response = await fetch(`${this.baseUrl}/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ticket:', error);
      
      // Fallback: Find in local storage
      const allTickets = this.getLocalTickets();
      return allTickets.find(ticket => ticket.id === ticketId) || null;
    }
  }

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      
      // Fallback: Update local storage
      const tickets = this.getLocalTickets();
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex !== -1) {
        tickets[ticketIndex].status = status;
        tickets[ticketIndex].updatedAt = new Date();
        localStorage.setItem('supportTickets', JSON.stringify(tickets));
        return tickets[ticketIndex];
      }
      throw error;
    }
  }

  // Add response to ticket
  async addResponse(ticketId: string, message: string, isFromSupport: boolean = false): Promise<SupportResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/support/tickets/${ticketId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ message, isFromSupport }),
      });

      if (!response.ok) {
        throw new Error('Failed to add response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding response:', error);
      
      // Fallback: Add to local storage
      const tickets = this.getLocalTickets();
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex !== -1) {
        const newResponse: SupportResponse = {
          id: `response_${Date.now()}`,
          ticketId,
          message,
          isFromSupport,
          authorName: isFromSupport ? 'Support Team' : tickets[ticketIndex].name,
          authorEmail: isFromSupport ? 'support@culturaft.com' : tickets[ticketIndex].email,
          createdAt: new Date()
        };
        
        tickets[ticketIndex].responses.push(newResponse);
        tickets[ticketIndex].updatedAt = new Date();
        localStorage.setItem('supportTickets', JSON.stringify(tickets));
        return newResponse;
      }
      throw error;
    }
  }

  // Get support statistics (admin only)
  async getSupportStats(): Promise<SupportStats> {
    try {
      const response = await fetch(`${this.baseUrl}/support/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch support stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching support stats:', error);
      
      // Fallback: Calculate from local tickets
      const tickets = this.getLocalTickets();
      return {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        averageResponseTime: 2.5, // Mock value in hours
        customerSatisfaction: 4.2 // Mock value out of 5
      };
    }
  }

  // Send email notification (would integrate with email service)
  async sendEmailNotification(ticketId: string, type: 'created' | 'updated' | 'resolved'): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/support/tickets/${ticketId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ type }),
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      // In a real implementation, this would integrate with an email service
      console.log(`Email notification would be sent for ticket ${ticketId}: ${type}`);
    }
  }

  // Local storage helpers for development
  private storeTicketLocally(ticket: SupportTicket): void {
    const existingTickets = this.getLocalTickets();
    existingTickets.push(ticket);
    localStorage.setItem('supportTickets', JSON.stringify(existingTickets));
  }

  private getLocalTickets(): SupportTicket[] {
    try {
      const stored = localStorage.getItem('supportTickets');
      if (stored) {
        const tickets = JSON.parse(stored);
        // Convert date strings back to Date objects
        return tickets.map((ticket: any) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          responses: ticket.responses.map((response: any) => ({
            ...response,
            createdAt: new Date(response.createdAt)
          }))
        }));
      }
      return [];
    } catch (error) {
      console.error('Error parsing local tickets:', error);
      return [];
    }
  }
}

export const supportService = new SupportService();