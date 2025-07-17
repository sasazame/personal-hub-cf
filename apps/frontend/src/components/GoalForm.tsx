import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Input, Label } from '@personal-hub/ui';
import { createGoalSchema, GoalTypes, type CreateGoalInput } from '@personal-hub/shared';
import { goalApi } from '../lib/goals';

interface GoalFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const getDefaultDates = () => {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    startDate: now.toISOString().split('T')[0] + 'T00:00:00Z',
    endDate: thirtyDaysLater.toISOString().split('T')[0] + 'T23:59:59Z',
  };
};

export function GoalForm({ onCancel, onSuccess }: GoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      type: GoalTypes.MONTHLY,
      ...getDefaultDates(),
    },
  });

  const createMutation = useMutation({
    mutationFn: goalApi.create,
    onSuccess,
  });

  const onSubmit = (data: CreateGoalInput) => {
    createMutation.mutate(data);
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Create New Goal</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Goal title"
            className="mt-1"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Goal description (optional)"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              {...register('type')}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            >
              <option value={GoalTypes.ANNUAL}>Annual</option>
              <option value={GoalTypes.MONTHLY}>Monthly</option>
              <option value={GoalTypes.WEEKLY}>Weekly</option>
              <option value={GoalTypes.DAILY}>Daily</option>
            </select>
          </div>

          <div>
            <Label htmlFor="targetValue">Target Value</Label>
            <Input
              id="targetValue"
              type="number"
              step="any"
              {...register('targetValue', { valueAsNumber: true })}
              placeholder="e.g., 100"
              className="mt-1"
            />
            {errors.targetValue && (
              <p className="text-red-500 text-sm mt-1">{errors.targetValue.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              {...register('unit')}
              placeholder="e.g., pages, km, hours"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              type="color"
              {...register('color')}
              defaultValue="#3B82F6"
              className="mt-1 h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              {...register('startDate', {
                setValueAs: (value) => {
                  if (!value) return '';
                  try {
                    return new Date(value).toISOString();
                  } catch (error) {
                    console.error('Invalid start date value:', error);
                    return '';
                  }
                },
              })}
              className="mt-1"
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              {...register('endDate', {
                setValueAs: (value) => {
                  if (!value) return '';
                  try {
                    return new Date(value).toISOString();
                  } catch (error) {
                    console.error('Invalid end date value:', error);
                    return '';
                  }
                },
              })}
              className="mt-1"
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
          >
            Create Goal
          </Button>
        </div>
      </form>
    </Card>
  );
}