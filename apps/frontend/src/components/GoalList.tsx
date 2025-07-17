import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoalTypes, GoalStatuses, type GoalType, type GoalStatus, type GoalQuery } from '@personal-hub/shared';
import { goalApi } from '../lib/goals';
import { GoalItem } from './GoalItem';
import { GoalForm } from './GoalForm';
import { Button } from '@personal-hub/ui';

export function GoalList() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Partial<GoalQuery>>({
    page: 1,
    limit: 20,
    status: GoalStatuses.ACTIVE,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals', filter],
    queryFn: () => goalApi.list(filter),
  });

  const handleFilterChange = (newFilter: Partial<GoalQuery>) => {
    setFilter((prev) => ({ ...prev, ...newFilter, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilter((prev) => ({ ...prev, page }));
  };

  const handleGoalDeleted = () => {
    refetch();
  };

  const handleGoalUpdated = () => {
    refetch();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    refetch();
  };

  if (isError) {
    return <div>Error loading goals. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Goals</h2>
        <Button onClick={() => setShowForm(true)}>Add Goal</Button>
      </div>

      {showForm && (
        <GoalForm onCancel={() => setShowForm(false)} onSuccess={handleFormSuccess} />
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={filter.status || ''}
          onChange={(e) => handleFilterChange({ status: e.target.value as GoalStatus || undefined })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value={GoalStatuses.ACTIVE}>Active</option>
          <option value={GoalStatuses.PAUSED}>Paused</option>
          <option value={GoalStatuses.COMPLETED}>Completed</option>
          <option value={GoalStatuses.ARCHIVED}>Archived</option>
        </select>

        <select
          value={filter.type || ''}
          onChange={(e) => handleFilterChange({ type: e.target.value as GoalType || undefined })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Types</option>
          <option value={GoalTypes.ANNUAL}>Annual</option>
          <option value={GoalTypes.MONTHLY}>Monthly</option>
          <option value={GoalTypes.WEEKLY}>Weekly</option>
          <option value={GoalTypes.DAILY}>Daily</option>
        </select>
      </div>

      {isLoading ? (
        <div>Loading goals...</div>
      ) : data?.goals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No goals found. Create your first goal!
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data?.goals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                onDeleted={handleGoalDeleted}
                onUpdated={handleGoalUpdated}
              />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(data.currentPage - 1)}
                disabled={data.currentPage === 1}
              >
                Previous
              </Button>
              <span className="py-2 px-4">
                Page {data.currentPage} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(data.currentPage + 1)}
                disabled={data.currentPage === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}