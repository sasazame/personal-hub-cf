import { Note, CreateNoteDto, UpdateNoteDto, NoteFilters } from '@/types/note';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function fetchNotes(filters?: NoteFilters): Promise<Note[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));

  const response = await fetch(`${API_BASE_URL}/api/v1/notes?${params}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }

  const data = await response.json();
  return data.data || [];
}

export async function fetchNoteTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notes/tags`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }

  const data = await response.json();
  return data.data || [];
}

export async function createNote(note: CreateNoteDto): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(note)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create note');
  }

  const data = await response.json();
  return data.data;
}

export async function updateNote(id: string, updates: UpdateNoteDto): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update note');
  }

  const data = await response.json();
  return data.data;
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete note');
  }
}