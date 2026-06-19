import * as notesRepo from '../repositories/notes.repository.js';
import * as ticketsRepo from '../repositories/tickets.repository.js';
import { NotFoundError } from '../utils/errors.js';

export async function listNotes(ticketId: string) {
  const ticket = await ticketsRepo.getTicketById(ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');
  const notes = await notesRepo.listNotes(ticketId);
  return notes.map((n) => ({
    id: n.id,
    content: n.content,
    adminName: n.admin_name,
    createdAt: n.created_at,
  }));
}

export async function addNote(ticketId: string, adminId: string, content: string) {
  const ticket = await ticketsRepo.getTicketById(ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');
  const note = await notesRepo.insertNote(ticketId, adminId, content);
  if (!note) throw new Error('Failed to create note');
  return {
    id: note.id,
    content: note.content,
    createdAt: note.created_at,
  };
}
