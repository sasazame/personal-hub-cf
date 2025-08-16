import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Button, Input, Modal } from '../components/ui';
import { MomentList } from '../components/MomentList';
import { MomentForm } from '../components/MomentForm';
import { MomentViewer } from '../components/MomentViewer';
import { MomentQuickForm } from '../components/MomentQuickForm';
import { Moment, CreateMomentDto, UpdateMomentDto, MomentPage } from '../types/moment';
import { momentApi } from '../lib/moment-api';
import { toast } from '../components/ui/toast';
import { Plus, Search, Tag } from 'lucide-react';

const PREVIEW_LENGTH = 100;

export function Moments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [viewingMoment, setViewingMoment] = useState<Moment | null>(null);
  const [momentToDelete, setMomentToDelete] = useState<Moment | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pages, setPages] = useState<MomentPage[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadMoments();
    loadTags();
  }, [searchQuery, selectedTag]);

  const loadMoments = async (pageNumber = 0) => {
    try {
      setIsLoading(pageNumber === 0);
      setIsFetchingNextPage(pageNumber > 0);

      const response = await momentApi.getMoments({
        page: pageNumber,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedTag && { tags: [selectedTag] }),
      });

      if (pageNumber === 0) {
        setPages([response]);
      } else {
        setPages((prev) => [...prev, response]);
      }

      setHasNextPage(!response.last);
    } catch (error) {
      toast.error('Failed to load moments');
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  };

  const loadTags = async () => {
    try {
      const tagsList = await momentApi.getTags();
      setTags(tagsList);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const fetchNextPage = () => {
    if (!isFetchingNextPage && hasNextPage) {
      loadMoments(pages.length);
    }
  };

  const handleCreateMoment = async (data: CreateMomentDto) => {
    try {
      setIsSubmitting(true);
      await momentApi.createMoment(data);
      toast.success('Moment created successfully');
      setIsFormOpen(false);
      loadMoments();
    } catch (error) {
      toast.error('Failed to create moment');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMoment = async (data: UpdateMomentDto) => {
    if (!selectedMoment?.id) return;

    try {
      setIsSubmitting(true);
      await momentApi.updateMoment(selectedMoment.id, data);
      toast.success('Moment updated successfully');
      setIsFormOpen(false);
      setSelectedMoment(null);
      setViewingMoment(null);
      loadMoments();
    } catch (error) {
      toast.error('Failed to update moment');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMoment = async () => {
    if (!momentToDelete?.id) return;

    try {
      setIsSubmitting(true);
      await momentApi.deleteMoment(momentToDelete.id);
      toast.success('Moment deleted successfully');
      setMomentToDelete(null);
      setViewingMoment(null);
      loadMoments();
    } catch (error) {
      toast.error('Failed to delete moment');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewMoment = () => {
    setSelectedMoment(null);
    setIsFormOpen(true);
  };

  const handleEditMoment = (moment: Moment) => {
    setSelectedMoment(moment);
    setViewingMoment(null);
    setIsFormOpen(true);
  };

  const handleViewMoment = (moment: Moment) => {
    setViewingMoment(moment);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedMoment(null);
  };

  const handleCloseViewer = () => {
    setViewingMoment(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Moments</h1>
            <p className="text-muted-foreground mt-1">
              Capture your thoughts, ideas, and experiences
            </p>
          </div>
          <Button
            onClick={handleNewMoment}
            variant="primary"
            size="lg"
            className="lg:hidden flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Moment
          </Button>
        </div>

        <div className="hidden lg:block sticky top-16 z-10 bg-background pb-4">
          <MomentQuickForm onSubmit={handleCreateMoment} isSubmitting={isSubmitting} />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search moments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pages.length > 0 && pages[0].totalElements !== undefined && (
          <div className="text-sm text-muted-foreground">
            {pages[0].totalElements} moments
            {searchQuery && ` (searching for "${searchQuery}")`}
            {selectedTag && ` (tagged with "${selectedTag}")`}
          </div>
        )}

        <MomentList
          pages={pages}
          onMomentClick={handleViewMoment}
          onEditMoment={handleEditMoment}
          onDeleteMoment={setMomentToDelete}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
        />

        <MomentForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={
            selectedMoment
              ? (data) => handleUpdateMoment(data as UpdateMomentDto)
              : (data) => handleCreateMoment(data as CreateMomentDto)
          }
          moment={selectedMoment || undefined}
          isSubmitting={isSubmitting}
        />

        <MomentViewer
          moment={viewingMoment}
          isOpen={!!viewingMoment}
          onClose={handleCloseViewer}
          onEdit={() => viewingMoment && handleEditMoment(viewingMoment)}
          onDelete={() => viewingMoment && setMomentToDelete(viewingMoment)}
        />

        {momentToDelete && (
          <Modal open={true} onClose={() => setMomentToDelete(null)}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Delete Moment</h2>
              <p className="text-muted-foreground">
                Are you sure you want to delete this moment? This action cannot be undone.
              </p>
              <div className="text-sm bg-muted rounded p-3 mt-2">
                &quot;{momentToDelete.content.substring(0, PREVIEW_LENGTH)}
                {momentToDelete.content.length > PREVIEW_LENGTH ? '...' : ''}&quot;
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setMomentToDelete(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteMoment}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}
