import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { Pencil, Trash2, X, Check, Clock } from 'lucide-react';
import { momentsApi } from '../lib/moments-api';
import type { MomentResponse, UpdateMomentInput } from '@personal-hub/shared';
import { formatDistanceToNow } from 'date-fns';

interface MomentItemProps {
  moment: MomentResponse;
}

export function MomentItem({ moment }: MomentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(moment.content);
  const [tags, setTags] = useState(moment.tags);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMomentInput) => momentsApi.update(moment.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Failed to update moment:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => momentsApi.delete(moment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
    },
    onError: (error) => {
      console.error('Failed to delete moment:', error);
    },
  });

  const handleUpdate = () => {
    if (content.trim()) {
      updateMutation.mutate({ content: content.trim(), tags });
    }
  };

  const handleCancel = () => {
    setContent(moment.content);
    setTags(moment.tags);
    setIsEditing(false);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formattedDate = formatDistanceToNow(new Date(moment.createdAt), { addSuffix: true });

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          {isEditing ? (
            <>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px]"
                maxLength={1000}
              />
              <div className="space-y-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tags (press Enter)"
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-xs hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={!content.trim() || updateMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{moment.content}</p>
              
              {moment.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {moment.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formattedDate}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Moment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this moment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}