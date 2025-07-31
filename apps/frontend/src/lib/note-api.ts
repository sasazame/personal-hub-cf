import { Note, CreateNoteDto, UpdateNoteDto, NoteFilters } from '@/types/note';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8787';

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
  return data.items || [];
}

export async function fetchNoteTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notes/tags`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }

  const tagData = await response.json();
  // Extract just the tag names from the array of {tag, count} objects
  return tagData.map((item: { tag: string; count: number }) => item.tag);
}

export async function createNote(note: CreateNoteDto): Promise<Note> {
  // Convert tags array to comma-separated string
  const payload = {
    ...note,
    tags: note.tags ? note.tags.join(',') : undefined
  };
  
  const response = await fetch(`${API_BASE_URL}/api/v1/notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create note');
  }

  const data = await response.json();
  return data; // Backend returns the note object directly
}

export async function updateNote(id: string, updates: UpdateNoteDto): Promise<Note> {
  // Convert tags array to comma-separated string
  const payload = {
    ...updates,
    tags: updates.tags ? updates.tags.join(',') : undefined
  };
  
  const response = await fetch(`${API_BASE_URL}/api/v1/notes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update note');
  }

  const data = await response.json();
  return data; // Backend returns the note object directly
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