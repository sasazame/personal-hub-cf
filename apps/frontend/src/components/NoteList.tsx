import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Search, Tag } from 'lucide-react';
import type { NoteResponse, ListNotesQuery } from '@personal-hub/shared';
import { notesApi } from '../lib/api/notes';
import { NoteItem } from './NoteItem';
import { NoteForm } from './NoteForm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function NoteList() {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [editingNote, setEditingNote] = useState<NoteResponse | undefined>();
  const limit = 20;

  const queryParams: ListNotesQuery = {
    search: searchTerm || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    limit,
    offset: page * limit,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['notes', queryParams],
    queryFn: () => notesApi.list(queryParams),
  });

  const handleEdit = (note: NoteResponse) => {
    setEditingNote(note);
    setShowNoteForm(true);
  };

  const handleCloseForm = () => {
    setShowNoteForm(false);
    setEditingNote(undefined);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  // Extract all unique tags from notes
  const allTags = data?.notes.reduce<string[]>((tags, note) => {
    if (note.tags) {
      note.tags.forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }
    return tags;
  }, []) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Notes
        </h2>
        <Button onClick={() => setShowNoteForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'updatedAt' | 'createdAt' | 'title')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'desc' | 'asc')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                    setPage(0);
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-red-500">Error loading notes: {(error as Error).message}</p>
        </Card>
      ) : data?.notes.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedTags.length > 0
              ? 'No notes found matching your criteria'
              : 'No notes yet'}
          </p>
          {(!searchTerm && selectedTags.length === 0) && (
            <Button onClick={() => setShowNoteForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first note
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {data?.notes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={showNoteForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
          </DialogHeader>
          <NoteForm
            note={editingNote}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}