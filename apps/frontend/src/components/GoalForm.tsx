import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { FormInput, FormTextArea } from '@/components/ui/FormField';
import { Goal, CreateGoalDto, UpdateGoalDto, GoalType, MetricType } from '@/types/goal';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  goalType: z.nativeEnum(GoalType),
  metricType: z.nativeEnum(MetricType),
  metricUnit: z.string().max(20, 'Unit must be less than 20 characters').optional(),
  targetValue: z.number().min(0.01, 'Target value must be greater than 0'),
  startDate: z.string(),
  endDate: z.string(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  goal?: Goal | null;
  onSubmit: (data: CreateGoalDto | UpdateGoalDto) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!goal;
  
  const defaultStartDate = format(new Date(), 'yyyy-MM-dd');
  const defaultEndDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title || '',
      description: goal?.description || '',
      goalType: goal?.goalType || GoalType.DAILY,
      metricType: goal?.metricType || MetricType.COUNT,
      metricUnit: goal?.metricUnit || '',
      targetValue: goal?.targetValue || 1,
      startDate: goal?.startDate ? format(new Date(goal.startDate), 'yyyy-MM-dd') : defaultStartDate,
      endDate: goal?.endDate ? format(new Date(goal.endDate), 'yyyy-MM-dd') : defaultEndDate,
    },
  });

  const metricType = watch('metricType');
  const startDate = watch('startDate');
  const goalType = watch('goalType');

  // Auto-calculate end date based on goal type
  useEffect(() => {
    if (!isEditing && startDate && goalType) {
      const start = new Date(startDate);
      let endDate: Date;
      
      switch (goalType) {
        case GoalType.DAILY:
          endDate = addDays(start, 30); // 30 days for daily goals
          break;
        case GoalType.WEEKLY:
          endDate = addWeeks(start, 12); // 12 weeks for weekly goals
          break;
        case GoalType.MONTHLY:
          endDate = addMonths(start, 12); // 1 year for monthly goals
          break;
        case GoalType.ANNUAL:
          endDate = addYears(start, 5); // 5 years for annual goals
          break;
      }
      
      setValue('endDate', format(endDate, 'yyyy-MM-dd'));
    }
  }, [goalType, startDate, isEditing, setValue]);

  const handleFormSubmit = async (data: GoalFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const updateData: UpdateGoalDto = {
          title: data.title,
          description: data.description,
          metricUnit: data.metricUnit,
          targetValue: data.targetValue,
          endDate: data.endDate,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateGoalDto = {
          ...data,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        };
        await onSubmit(createData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMetricPlaceholder = () => {
    switch (metricType) {
      case MetricType.COUNT:
        return 'e.g., 10 (times)';
      case MetricType.NUMERIC:
        return 'e.g., 5000 (steps)';
      case MetricType.PERCENTAGE:
        return 'e.g., 80 (%)';
      case MetricType.TIME:
        return 'e.g., 60 (minutes)';
      default:
        return '';
    }
  };

  const getMetricUnitPlaceholder = () => {
    switch (metricType) {
      case MetricType.COUNT:
        return 'times, items, etc.';
      case MetricType.NUMERIC:
        return 'steps, km, pages, etc.';
      case MetricType.PERCENTAGE:
        return '% (percentage)';
      case MetricType.TIME:
        return 'minutes, hours, etc.';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormInput
        label="Title"
        error={errors.title}
        required
        {...register('title')}
        placeholder="e.g., Read 30 minutes daily"
        autoFocus
      />

      <FormTextArea
        label="Description"
        error={errors.description}
        {...register('description')}
        placeholder="Describe your goal and why it's important to you"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Goal Type
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            {...register('goalType')}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isEditing}
          >
            <option value={GoalType.DAILY}>Daily</option>
            <option value={GoalType.WEEKLY}>Weekly</option>
            <option value={GoalType.MONTHLY}>Monthly</option>
            <option value={GoalType.ANNUAL}>Annual</option>
          </select>
          {errors.goalType && (
            <p className="mt-1 text-sm text-red-500">{errors.goalType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Metric Type
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            {...register('metricType')}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isEditing}
          >
            <option value={MetricType.COUNT}>Count</option>
            <option value={MetricType.NUMERIC}>Numeric</option>
            <option value={MetricType.PERCENTAGE}>Percentage</option>
            <option value={MetricType.TIME}>Time</option>
          </select>
          {errors.metricType && (
            <p className="mt-1 text-sm text-red-500">{errors.metricType.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Target Value"
          error={errors.targetValue}
          required
          {...register('targetValue', { valueAsNumber: true })}
          type="number"
          step="0.01"
          placeholder={getMetricPlaceholder()}
        />

        <FormInput
          label="Unit (optional)"
          error={errors.metricUnit}
          {...register('metricUnit')}
          placeholder={getMetricUnitPlaceholder()}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Start Date"
          error={errors.startDate}
          required
          {...register('startDate')}
          type="date"
          disabled={isEditing}
        />

        <FormInput
          label="End Date"
          error={errors.endDate}
          required
          {...register('endDate')}
          type="date"
          min={startDate}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}