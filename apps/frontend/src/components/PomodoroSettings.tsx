import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { pomodoroApi } from '../lib/api/pomodoro';
import type { UpdateConfigRequest } from '@personal-hub/shared';

const settingsSchema = z.object({
  workDuration: z.number().int().min(1).max(60),
  shortBreakDuration: z.number().int().min(1).max(30),
  longBreakDuration: z.number().int().min(1).max(60),
  longBreakInterval: z.number().int().min(1).max(10),
  autoStartBreaks: z.boolean(),
  autoStartPomodoros: z.boolean(),
  soundEnabled: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface PomodoroSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PomodoroSettings({ open, onOpenChange }: PomodoroSettingsProps) {
  const queryClient = useQueryClient();

  // Fetch current config
  const { data: config } = useQuery({
    queryKey: ['pomodoro-config'],
    queryFn: async () => {
      const response = await pomodoroApi.getConfig();
      return response.data;
    },
  });

  // Update config mutation
  const updateConfig = useMutation({
    mutationFn: (data: UpdateConfigRequest) => pomodoroApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-config'] });
      onOpenChange(false);
    },
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      workDuration: config?.workDuration || 25,
      shortBreakDuration: config?.shortBreakDuration || 5,
      longBreakDuration: config?.longBreakDuration || 15,
      longBreakInterval: config?.longBreakInterval || 4,
      autoStartBreaks: config?.autoStartBreaks || false,
      autoStartPomodoros: config?.autoStartPomodoros || false,
      soundEnabled: config?.soundEnabled ?? true,
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateConfig.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workDuration">Work Duration (min)</Label>
              <Input
                id="workDuration"
                type="number"
                {...form.register('workDuration', { valueAsNumber: true })}
                min={1}
                max={60}
              />
              {form.formState.errors.workDuration && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.workDuration.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shortBreakDuration">Short Break (min)</Label>
              <Input
                id="shortBreakDuration"
                type="number"
                {...form.register('shortBreakDuration', { valueAsNumber: true })}
                min={1}
                max={30}
              />
              {form.formState.errors.shortBreakDuration && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.shortBreakDuration.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="longBreakDuration">Long Break (min)</Label>
              <Input
                id="longBreakDuration"
                type="number"
                {...form.register('longBreakDuration', { valueAsNumber: true })}
                min={1}
                max={60}
              />
              {form.formState.errors.longBreakDuration && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.longBreakDuration.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longBreakInterval">Long Break After</Label>
              <Input
                id="longBreakInterval"
                type="number"
                {...form.register('longBreakInterval', { valueAsNumber: true })}
                min={1}
                max={10}
              />
              {form.formState.errors.longBreakInterval && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.longBreakInterval.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoStartBreaks"
                checked={form.watch('autoStartBreaks')}
                onCheckedChange={(checked) => 
                  form.setValue('autoStartBreaks', checked as boolean)
                }
              />
              <Label htmlFor="autoStartBreaks" className="cursor-pointer">
                Auto-start breaks
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoStartPomodoros"
                checked={form.watch('autoStartPomodoros')}
                onCheckedChange={(checked) => 
                  form.setValue('autoStartPomodoros', checked as boolean)
                }
              />
              <Label htmlFor="autoStartPomodoros" className="cursor-pointer">
                Auto-start work sessions
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="soundEnabled"
                checked={form.watch('soundEnabled')}
                onCheckedChange={(checked) => 
                  form.setValue('soundEnabled', checked as boolean)
                }
              />
              <Label htmlFor="soundEnabled" className="cursor-pointer">
                Enable notification sound
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateConfig.isPending}>
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}