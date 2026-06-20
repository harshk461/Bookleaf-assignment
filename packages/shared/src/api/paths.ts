export const API_PATHS = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
  },
  author: {
    books: '/api/author/books',
    book: (bookId: string) => `/api/author/books/${bookId}`,
    bookSales: (bookId: string) => `/api/author/books/${bookId}/sales`,
    tickets: '/api/author/tickets',
    ticket: (id: string) => `/api/author/tickets/${id}`,
    ticketMessages: (id: string) => `/api/author/tickets/${id}/messages`,
    ticketStream: '/api/author/tickets/stream',
    ticketStreamDetail: (id: string) => `/api/author/tickets/${id}/stream`,
    ticketAttachment: (ticketId: string, attachmentId: string) =>
      `/api/author/tickets/${ticketId}/attachments/${attachmentId}`,
  },
  admin: {
    tickets: '/api/admin/tickets',
    ticket: (id: string) => `/api/admin/tickets/${id}`,
    ticketStream: '/api/admin/tickets/stream',
    ticketDraft: (id: string) => `/api/admin/tickets/${id}/draft`,
    ticketResponses: (id: string) => `/api/admin/tickets/${id}/responses`,
    ticketNotes: (id: string) => `/api/admin/tickets/${id}/notes`,
    ticketAttachment: (ticketId: string, attachmentId: string) =>
      `/api/admin/tickets/${ticketId}/attachments/${attachmentId}`,
    health: '/health',
  },
} as const;
