import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Timer, Search } from 'lucide-react';
import { commandRegistry } from '../lib/command-registry';
import { useFeatures } from '../contexts/FeatureContext';
import { Command } from '../types/command-palette';

export function useActionCommands() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { features } = useFeatures();

  useEffect(() => {
    const actionCommands: Command[] = [
      {
        id: 'action-new-todo',
        title: t('commandPalette.newTodo', 'New TODO'),
        description: t('commandPalette.createNewTodo', 'Create a new todo item'),
        category: 'action',
        icon: Plus,
        keywords: ['create', 'add', 'task'],
        action: () => navigate('/todos', { state: { openAddModal: true } }),
        isAvailable: () => features.todos,
      },
      {
        id: 'action-new-note',
        title: t('commandPalette.newNote', 'New Note'),
        description: t('commandPalette.createNewNote', 'Create a new note'),
        category: 'action',
        icon: Plus,
        keywords: ['create', 'add', 'write'],
        action: () => navigate('/notes', { state: { openAddModal: true } }),
        isAvailable: () => features.notes,
      },
      {
        id: 'action-new-goal',
        title: t('commandPalette.newGoal', 'New Goal'),
        description: t('commandPalette.createNewGoal', 'Create a new goal'),
        category: 'action',
        icon: Plus,
        keywords: ['create', 'add', 'target'],
        action: () => navigate('/goals', { state: { openAddModal: true } }),
        isAvailable: () => features.goals,
      },
      {
        id: 'action-new-moment',
        title: t('commandPalette.newMoment', 'New Moment'),
        description: t('commandPalette.createNewMoment', 'Create a new moment'),
        category: 'action',
        icon: Plus,
        keywords: ['create', 'add', 'memory'],
        action: () => navigate('/moments', { state: { openAddModal: true } }),
        isAvailable: () => features.moments,
      },
      {
        id: 'action-new-event',
        title: t('commandPalette.newEvent', 'New Event'),
        description: t('commandPalette.createNewEvent', 'Create a new calendar event'),
        category: 'action',
        icon: Plus,
        keywords: ['create', 'add', 'schedule'],
        action: () => navigate('/calendar', { state: { openAddModal: true } }),
        isAvailable: () => features.calendar,
      },
      {
        id: 'action-start-pomodoro',
        title: t('commandPalette.startPomodoro', 'Start Pomodoro'),
        description: t('commandPalette.startPomodoroTimer', 'Start a pomodoro timer session'),
        category: 'action',
        icon: Timer,
        keywords: ['timer', 'focus', 'productivity'],
        action: () => navigate('/pomodoro', { state: { autoStart: true } }),
        isAvailable: () => features.pomodoro,
      },
    ];

    const searchCommands: Command[] = [
      {
        id: 'search-todos',
        title: t('commandPalette.searchTodos', 'Search TODOs'),
        description: t('commandPalette.searchTodoItems', 'Search todo items'),
        category: 'search',
        icon: Search,
        keywords: ['find', 'filter', 'todos', 'tasks'],
        action: () => navigate('/todos', { state: { focusSearch: true } }),
        isAvailable: () => features.todos,
      },
      {
        id: 'search-notes',
        title: t('commandPalette.searchNotes', 'Search Notes'),
        description: t('commandPalette.searchNoteContent', 'Search note content'),
        category: 'search',
        icon: Search,
        keywords: ['find', 'filter', 'notes'],
        action: () => navigate('/notes', { state: { focusSearch: true } }),
        isAvailable: () => features.notes,
      },
      {
        id: 'search-moments',
        title: t('commandPalette.searchMoments', 'Search Moments'),
        description: t('commandPalette.searchMomentContent', 'Search moment content'),
        category: 'search',
        icon: Search,
        keywords: ['find', 'filter', 'moments', 'memories'],
        action: () => navigate('/moments', { state: { focusSearch: true } }),
        isAvailable: () => features.moments,
      },
    ];

    const allCommands = [...actionCommands, ...searchCommands];
    allCommands.forEach(command => commandRegistry.register(command));

    return () => {
      allCommands.forEach(cmd => commandRegistry.unregister(cmd.id));
    };
  }, [navigate, t, features]);
}