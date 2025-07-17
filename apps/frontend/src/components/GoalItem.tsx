import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, Button } from '@personal-hub/ui';
import { GoalStatus, type Goal, type GoalProgressInput } from '@personal-hub/shared';
import { goalApi } from '../lib/goals';

interface GoalItemProps {
  goal: Goal;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function GoalItem({ goal, onDeleted, onUpdated }: GoalItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [progressNote, setProgressNote] = useState('');

  const { data: goalWithProgress, refetch: refetchGoal } = useQuery({
    queryKey: ['goal', goal.id],
    queryFn: () => goalApi.get(goal.id),
    enabled: isExpanded,
  });

  const deleteMutation = useMutation({
    mutationFn: () => goalApi.delete(goal.id),
    onSuccess: onDeleted,
  });

  const statusMutation = useMutation({
    mutationFn: (status: GoalStatus) => goalApi.update(goal.id, { status }),
    onSuccess: onUpdated,
  });

  const progressMutation = useMutation({
    mutationFn: (data: GoalProgressInput) => goalApi.addProgress(goal.id, data),
    onSuccess: () => {
      setProgressValue('');
      setProgressNote('');
      setShowProgressForm(false);
      refetchGoal();
      onUpdated();
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate();
    }
  };

  const handleAddProgress = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(progressValue);
    if (!isNaN(value)) {
      progressMutation.mutate({
        value,
        note: progressNote || undefined,
      });
    }
  };

  const progressPercentage = goal.targetValue
    ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
    : 0;

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ACTIVE:
        return 'text-green-600';
      case GoalStatus.PAUSED:
        return 'text-yellow-600';
      case GoalStatus.COMPLETED:
        return 'text-blue-600';
      case GoalStatus.ARCHIVED:
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{goal.title}</h3>
          {goal.description && (
            <p className="text-gray-600 mt-1">{goal.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span className="capitalize">{goal.type.toLowerCase()}</span>
            <span className={getStatusColor(goal.status)}>
              {goal.status}
            </span>
            <span>
              {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      {goal.targetValue && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>
              {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: goal.color || undefined,
              }}
            />
          </div>
          <div className="text-right text-sm text-gray-500 mt-1">
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="flex gap-2">
            {goal.status !== GoalStatus.COMPLETED && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowProgressForm(!showProgressForm)}
              >
                Add Progress
              </Button>
            )}
            {goal.status === GoalStatus.ACTIVE && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate(GoalStatus.PAUSED)}
                disabled={statusMutation.isPending}
              >
                Pause
              </Button>
            )}
            {goal.status === GoalStatus.PAUSED && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate(GoalStatus.ACTIVE)}
                disabled={statusMutation.isPending}
              >
                Resume
              </Button>
            )}
            {goal.status !== GoalStatus.COMPLETED && goal.status !== GoalStatus.ARCHIVED && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate(GoalStatus.COMPLETED)}
                disabled={statusMutation.isPending}
              >
                Mark Complete
              </Button>
            )}
          </div>

          {showProgressForm && (
            <form onSubmit={handleAddProgress} className="bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Value"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  className="px-3 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button type="submit" size="sm" disabled={progressMutation.isPending}>
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProgressForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {goalWithProgress?.progress && goalWithProgress.progress.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Progress History</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {goalWithProgress.progress.map((entry) => (
                  <div key={entry.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <div>
                      <span className="font-medium">+{entry.value}</span>
                      {entry.note && <span className="text-gray-600 ml-2">{entry.note}</span>}
                    </div>
                    <span className="text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}