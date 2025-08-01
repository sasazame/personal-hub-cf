import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { goalApi } from '@/lib/goal-api';
import { toast } from '@/components/ui/toast';
import { Goal, GoalType, GoalWithStatus, CreateGoalDto, UpdateGoalDto, GoalFilter } from '@/types/goal';
import { format, addDays, subDays } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Zap, Target, TrendingUp } from 'lucide-react';
import { GoalForm } from '@/components/GoalForm';

export function Goals() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goals, setGoals] = useState<GoalWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<GoalFilter>('active');
  const [expandedGroups, setExpandedGroups] = useState<Record<GoalType, boolean>>({
    [GoalType.DAILY]: true,
    [GoalType.WEEKLY]: true,
    [GoalType.MONTHLY]: true,
    [GoalType.ANNUAL]: true,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  useEffect(() => {
    loadGoals();
  }, [selectedDate, filter]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const data = await goalApi.getGoals(format(selectedDate, 'yyyy-MM-dd'), filter);
      setGoals(data);
    } catch (error) {
      toast.error('Failed to load goals');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (data: CreateGoalDto) => {
    try {
      await goalApi.createGoal(data);
      toast.success('Goal created successfully');
      setIsFormOpen(false);
      loadGoals();
    } catch (error) {
      toast.error('Failed to create goal');
      console.error(error);
    }
  };

  const handleUpdateGoal = async (id: number, data: UpdateGoalDto) => {
    try {
      await goalApi.updateGoal(id, data);
      toast.success('Goal updated successfully');
      setIsFormOpen(false);
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      toast.error('Failed to update goal');
      console.error(error);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await goalApi.deleteGoal(goalToDelete.id);
      toast.success('Goal deleted successfully');
      setGoalToDelete(null);
      loadGoals();
    } catch (error) {
      toast.error('Failed to delete goal');
      console.error(error);
    }
  };

  const handleToggleAchievement = async (goalId: number) => {
    try {
      await goalApi.toggleAchievement(goalId, format(selectedDate, 'yyyy-MM-dd'));
      toast.success('Progress updated');
      loadGoals();
    } catch (error) {
      toast.error('Failed to update progress');
      console.error(error);
    }
  };

  const toggleGroup = (type: GoalType) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const goalsByType = {
    [GoalType.DAILY]: goals.filter(g => g.goalType === GoalType.DAILY),
    [GoalType.WEEKLY]: goals.filter(g => g.goalType === GoalType.WEEKLY),
    [GoalType.MONTHLY]: goals.filter(g => g.goalType === GoalType.MONTHLY),
    [GoalType.ANNUAL]: goals.filter(g => g.goalType === GoalType.ANNUAL),
  };

  const typeLabels = {
    [GoalType.DAILY]: 'Daily Goals',
    [GoalType.WEEKLY]: 'Weekly Goals',
    [GoalType.MONTHLY]: 'Monthly Goals',
    [GoalType.ANNUAL]: 'Annual Goals',
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-lg text-gray-500">Loading goals...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Goals
            </h1>
            <p className="text-gray-500 mt-1">
              Track your progress and achieve your targets
            </p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)} 
            variant="primary"
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            New Goal
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as GoalFilter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goals by Type */}
        <div className="space-y-4">
          {Object.entries(goalsByType).map(([type, typeGoals]) => {
            const expanded = expandedGroups[type as GoalType];
            
            return (
              <div key={type} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <button
                  onClick={() => toggleGroup(type as GoalType)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {typeLabels[type as GoalType]}
                    </h3>
                    <span className="text-sm text-gray-500">({typeGoals.length})</span>
                  </div>
                </button>
                
                {expanded && (
                  <div className="p-4 pt-0">
                    {typeGoals.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">
                        No {typeLabels[type as GoalType].toLowerCase()} found
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {typeGoals.map(goal => (
                          <div
                            key={goal.id}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {goal.title}
                              </h4>
                              <button
                                onClick={() => handleToggleAchievement(goal.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  goal.completed
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                <Target className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {goal.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {goal.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Zap className="w-4 h-4" />
                                <span>{goal.currentStreak} day streak</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <TrendingUp className="w-4 h-4" />
                                <span>{goal.progressPercentage}%</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full transition-all"
                                style={{ width: `${goal.progressPercentage}%` }}
                              />
                            </div>
                            
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedGoal(goal);
                                  setIsFormOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setGoalToDelete(goal)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Goal Form Modal */}
        {isFormOpen && (
          <Modal 
            open={isFormOpen} 
            onClose={() => {
              setIsFormOpen(false);
              setSelectedGoal(null);
            }}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {selectedGoal ? 'Edit Goal' : 'New Goal'}
              </h2>
              <GoalForm
                goal={selectedGoal}
                onSubmit={async (data) => {
                  if (selectedGoal) {
                    await handleUpdateGoal(selectedGoal.id, data as UpdateGoalDto);
                  } else {
                    await handleCreateGoal(data as CreateGoalDto);
                  }
                }}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedGoal(null);
                }}
              />
            </div>
          </Modal>
        )}

        {/* Delete Confirmation */}
        {goalToDelete && (
          <Modal open={true} onClose={() => setGoalToDelete(null)}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Delete Goal</h2>
              <p className="text-gray-500">
                Are you sure you want to delete "{goalToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setGoalToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteGoal}
                  className="bg-red-600 hover:bg-red-700"
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