import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { NoteList } from '@/components/NoteList';
import { NoteForm } from '@/components/NoteForm';
import { NoteViewer } from '@/components/NoteViewer';
import { showSuccess, showError } from '@/components/ui/toast';
import { Note, CreateNoteDto, UpdateNoteDto, NoteFilters } from '@/types/note';
import {
  fetchNotes,
  fetchNoteTags,
  createNote,
  updateNote,
  deleteNote
} from '@/lib/note-api';

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const filters: NoteFilters = {
        search: searchQuery,
        tags: selectedTag ? [selectedTag] : undefined
      };
      const data = await fetchNotes(filters);
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
      showError('Failed to load notes');
    }
  }, [searchQuery, selectedTag]);

  const loadTags = useCallback(async (force = false) => {
    // Only reload tags if not loaded yet or forced
    if (tagsLoaded && !force) return;
    
    try {
      const data = await fetchNoteTags();
      setTags(data);
      setTagsLoaded(true);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, [tagsLoaded]);

  // Load tags only once on mount
  useEffect(() => {
    loadTags();
  }, []);

  // Load notes when filters change
  useEffect(() => {
    setIsLoading(true);
    loadNotes().finally(() => {
      setIsLoading(false);
    });
  }, [loadNotes]);

  const handleCreateNote = async (data: CreateNoteDto) => {
    setIsSubmitting(true);
    try {
      const newNote = await createNote(data);
      showSuccess('Note created');
      setIsFormOpen(false);
      loadNotes();
      // Only reload tags if new tags were added
      if (data.tags.some(tag => !tags.includes(tag))) {
        loadTags(true);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      showError(error instanceof Error ? error.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async (data: UpdateNoteDto) => {
    if (!selectedNote) return;
    
    setIsSubmitting(true);
    try {
      const updatedNote = await updateNote(selectedNote.id, data);
      showSuccess('Note updated');
      setIsFormOpen(false);
      setSelectedNote(null);
      setViewingNote(null);
      loadNotes();
      // Only reload tags if tags were changed
      const oldTags = selectedNote.tags;
      const newTags = data.tags || [];
      const tagsChanged = oldTags.some(tag => !newTags.includes(tag)) || 
                         newTags.some(tag => !tags.includes(tag));
      if (tagsChanged) {
        loadTags(true);
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      showError(error instanceof Error ? error.message : 'Failed to update note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote(noteToDelete.id);
      showSuccess('Note deleted');
      setNoteToDelete(null);
      setViewingNote(null);
      
      // Optimistically update notes list
      setNotes(prevNotes => prevNotes.filter(n => n.id !== noteToDelete.id));
      
      // Check if we need to remove any tags from the list
      const remainingNotes = notes.filter(n => n.id !== noteToDelete.id);
      const remainingTags = new Set(remainingNotes.flatMap(n => n.tags));
      const deletedTags = noteToDelete.tags.filter(tag => !remainingTags.has(tag));
      
      // Reload notes to ensure consistency
      loadNotes();
      
      // Only reload tags if some tags are no longer used
      if (deletedTags.length > 0) {
        loadTags(true);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete note');
    }
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setIsFormOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setViewingNote(null);
    setIsFormOpen(true);
  };

  const handleViewNote = (note: Note) => {
    setViewingNote(note);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Notes
            </h1>
            <p className="text-muted-foreground mt-1">
              Capture your thoughts and ideas
            </p>
          </div>
          <Button
            onClick={handleNewNote}
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Note
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="text-sm text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
          {searchQuery && ` (searching for "${searchQuery}")`}
          {selectedTag && ` (filtered by tag: ${selectedTag})`}
        </div>

        {/* Note List */}
        <NoteList
          notes={notes}
          onNoteClick={handleViewNote}
          onEditNote={handleEditNote}
          onDeleteNote={setNoteToDelete}
        />

        {/* Note Form */}
        <NoteForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedNote(null);
          }}
          onSubmit={selectedNote ? handleUpdateNote : handleCreateNote}
          note={selectedNote || undefined}
          isSubmitting={isSubmitting}
        />

        {/* Note Viewer */}
        <NoteViewer
          note={viewingNote}
          isOpen={!!viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={() => viewingNote && handleEditNote(viewingNote)}
          onDelete={() => viewingNote && setNoteToDelete(viewingNote)}
        />

        {/* Delete Confirmation Modal */}
        {noteToDelete && (
          <Modal open={true} onClose={() => setNoteToDelete(null)}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Delete Note
              </h2>
              <p className="text-muted-foreground">
                Are you sure you want to delete "{noteToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setNoteToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteNote}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}