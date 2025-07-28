export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  tags: string[];
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface NoteFilters {
  search?: string;
  tags?: string[];
}