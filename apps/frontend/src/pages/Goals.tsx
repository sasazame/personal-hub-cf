import { useState, useEffect, useOptimistic } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { goalApi } from '@/lib/goal-api';
import { toast } from '@/components/ui/toast';
import {
  Goal,
  GoalType,
  GoalWithStatus,
  CreateGoalDto,
  UpdateGoalDto,
  GoalFilter,
  GoalStatus,
} from '@/types/goal';
import { format, addDays, subDays } from 'date-fns';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';
import { GoalForm } from '@/components/GoalForm';

export function Goals() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goals, setGoals] = useState<GoalWithStatus[]>([]);
  type GoalAction =
    | { type: 'create'; goal: GoalWithStatus }
    | { type: 'update'; id: number; delta: Partial<GoalWithStatus> }
    | { type: 'toggleComplete'; id: number }
  const [optimisticGoals, updateGoalsOptimistic] = useOptimistic<GoalWithStatus[], GoalAction>(
    goals,
    (state, action) => {
      switch (action.type) {
        case 'create':
          return [action.goal, ...state]
        case 'update':
          return state.map((g) => (g.id === action.id ? { ...g, ...action.delta } : g))
        case 'toggleComplete':
          return state.map((g) => (g.id === action.id ? { ...g, completed: !g.completed } : g))
        default:
          return state
      }
    }
  )
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

  // Handle navigation state from command palette
  useEffect(() => {
    const state = location.state as { openAddModal?: boolean } | null;
    if (state?.openAddModal) {
      setIsFormOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} }
      );
    }
  }, [location.state, navigate]);

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
      // Optimistically add a temporary goal
      const nowIso = new Date().toISOString();
      const temp: GoalWithStatus = {
        id: -Date.now(),
        title: data.title,
        description: data.description,
        goalType: data.goalType,
        metricType: data.metricType,
        metricUnit: data.metricUnit,
        targetValue: data.targetValue,
        currentValue: 0,
        progressPercentage: 0,
        startDate: data.startDate,
        endDate: data.endDate,
        status: GoalStatus.ACTIVE,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        completed: false,
        currentStreak: 0,
        longestStreak: 0,
      }
      updateGoalsOptimistic({ type: 'create', goal: temp })
      await goalApi.createGoal(data);
      toast.success('Goal created successfully');
      setIsFormOpen(false);
      loadGoals();
    } catch (error) {
      toast.error('Failed to create goal');
      console.error(error);
      loadGoals();
    }
  };

  const handleUpdateGoal = async (id: number, data: UpdateGoalDto) => {
    try {
      updateGoalsOptimistic({ type: 'update', id, delta: data as Partial<GoalWithStatus> })
      await goalApi.updateGoal(id, data);
      toast.success('Goal updated successfully');
      setIsFormOpen(false);
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      toast.error('Failed to update goal');
      console.error(error);
      loadGoals();
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
      // Optimistically toggle completion flag; server will compute stats
      updateGoalsOptimistic({ type: 'toggleComplete', id: goalId })
      await goalApi.toggleAchievement(goalId, format(selectedDate, 'yyyy-MM-dd'));
      toast.success('Progress updated');
      loadGoals();
    } catch (error) {
      toast.error('Failed to update progress');
      console.error(error);
      loadGoals();
    }
  };

  const toggleGroup = (type: GoalType) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const goalsByType = {
    [GoalType.DAILY]: optimisticGoals.filter((g) => g.goalType === GoalType.DAILY),
    [GoalType.WEEKLY]: optimisticGoals.filter((g) => g.goalType === GoalType.WEEKLY),
    [GoalType.MONTHLY]: optimisticGoals.filter((g) => g.goalType === GoalType.MONTHLY),
    [GoalType.ANNUAL]: optimisticGoals.filter((g) => g.goalType === GoalType.ANNUAL),
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
            <h1 className="text-3xl font-bold text-foreground">Goals</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress and achieve your targets
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} variant="primary" size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            New Goal
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-medium text-foreground">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <Button variant="secondary" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as GoalFilter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
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
              <div key={type} className="bg-card rounded-lg shadow-sm">
                <button
                  onClick={() => toggleGroup(type as GoalType)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    )}
                    <h3 className="text-lg font-semibold text-foreground">
                      {typeLabels[type as GoalType]}
                    </h3>
                    <span className="text-sm text-muted-foreground">({typeGoals.length})</span>
                  </div>
                </button>

                {expanded && (
                  <div className="p-4 pt-0">
                    {typeGoals.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No {typeLabels[type as GoalType].toLowerCase()} found
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {typeGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className="bg-muted/30 rounded-lg p-4 border border-border"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-foreground">{goal.title}</h4>
                              <button
                                onClick={() => handleToggleAchievement(goal.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  goal.completed
                                    ? 'bg-success/20 text-success'
                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                }`}
                              >
                                <Target className="w-4 h-4" />
                              </button>
                            </div>

                            {goal.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {goal.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Zap className="w-4 h-4" />
                                <span>{goal.currentStreak} day streak</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="w-4 h-4" />
                                <span>{goal.progressPercentage}%</span>
                              </div>
                            </div>

                            <div className="mt-3 bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all"
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
                                className="text-destructive hover:text-destructive/80"
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
              <h2 className="text-xl font-semibold mb-4 text-foreground">
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
              <h2 className="text-xl font-semibold text-foreground">Delete Goal</h2>
              <p className="text-muted-foreground">
                Are you sure you want to delete "{goalToDelete.title}"? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setGoalToDelete(null)}>
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
