import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const { t } = useTranslation(['notes', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
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
      showError(t('messages.loadFailed'));
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

  // Handle navigation state from command palette
  useEffect(() => {
    const state = location.state as { openAddModal?: boolean; focusSearch?: boolean } | null;
    let handled = false;
    if (state?.openAddModal) {
      setIsFormOpen(true);
      handled = true;
    }
    if (state?.focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
      handled = true;
    }
    if (handled) {
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} }
      );
    }
  }, [location.state, navigate]);

  const handleCreateNote = async (data: CreateNoteDto) => {
    setIsSubmitting(true);
    try {
      await createNote(data);
      showSuccess(t('messages.noteCreated'));
      setIsFormOpen(false);
      loadNotes();
      // Only reload tags if new tags were added
      if (data.tags.some(tag => !tags.includes(tag))) {
        loadTags(true);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      showError(error instanceof Error ? error.message : t('messages.noteCreateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async (data: UpdateNoteDto) => {
    if (!selectedNote) return;
    
    setIsSubmitting(true);
    try {
      await updateNote(selectedNote.id, data);
      showSuccess(t('messages.noteUpdated'));
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
      showError(error instanceof Error ? error.message : t('messages.noteUpdateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote(noteToDelete.id);
      showSuccess(t('messages.noteDeleted'));
      setNoteToDelete(null);
      setViewingNote(null);
      
      // Optimistically update notes list and derive remaining tags from the same snapshot
      const updatedNotes = notes.filter(n => n.id !== noteToDelete.id);
      setNotes(updatedNotes);
      const remainingTags = new Set(updatedNotes.flatMap(n => n.tags));
      const deletedTags = noteToDelete.tags.filter(tag => !remainingTags.has(tag));
      
      // Reload notes to ensure consistency
      loadNotes();
      
      // Only reload tags if some tags are no longer used
      if (deletedTags.length > 0) {
        loadTags(true);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      showError(error instanceof Error ? error.message : t('messages.noteDeleteFailed'));
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
          <div className="text-lg text-muted-foreground">{t('messages.loading')}</div>
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
              {t('labels.notes')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('labels.subtitle')}
            </p>
          </div>
          <Button
            onClick={handleNewNote}
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('newNote')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={t('searchPlaceholder')}
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
            <option value="">{t('labels.allTags')}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="text-sm text-muted-foreground">
          {t('labels.stats', { count: notes.length })}
          {searchQuery && ' ' + t('labels.searching', { query: searchQuery })}
          {selectedTag && ' ' + t('labels.filtered', { tag: selectedTag })}
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
                {t('deleteNote')}
              </h2>
              <p className="text-muted-foreground">
                {t('messages.confirmDelete', { title: noteToDelete.title })}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setNoteToDelete(null)}
                >
                  {t('labels.cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteNote}
                >
                  {t('labels.delete')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}