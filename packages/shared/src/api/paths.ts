export const API_PATHS = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
  },
  author: {
    books: '/api/author/books',
    book: (bookId: string) => `/api/author/books/${bookId}`,
    tickets: '/api/author/tickets',
    ticket: (id: string) => `/api/author/tickets/${id}`,
    ticketStream: '/api/author/tickets/stream',
  },
  admin: {
    tickets: '/api/admin/tickets',
    ticket: (id: string) => `/api/admin/tickets/${id}`,
    ticketResponses: (id: string) => `/api/admin/tickets/${id}/responses`,
    ticketNotes: (id: string) => `/api/admin/tickets/${id}/notes`,
    health: '/health',
  },
} as const;
