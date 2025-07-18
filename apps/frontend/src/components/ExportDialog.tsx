import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  exportTodos,
  exportGoals,
  exportEvents,
  exportNotes,
  exportMoments,
  exportPomodoro,
} from '@/lib/api/export';
import type { ExportFormat } from '@personal-hub/shared';

interface ExportOption {
  id: string;
  label: string;
  exportFn: (options: any) => Promise<void>;
}

const exportOptions: ExportOption[] = [
  { id: 'todos', label: 'Todos', exportFn: exportTodos },
  { id: 'goals', label: 'Goals', exportFn: exportGoals },
  { id: 'events', label: 'Events', exportFn: exportEvents },
  { id: 'notes', label: 'Notes', exportFn: exportNotes },
  { id: 'moments', label: 'Moments', exportFn: exportMoments },
  { id: 'pomodoro', label: 'Pomodoro Sessions', exportFn: exportPomodoro },
];

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one type of data to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const exportPromises = selectedItems.map(itemId => {
        const option = exportOptions.find(opt => opt.id === itemId);
        if (!option) return Promise.resolve();
        
        const exportParams: any = { format };
        if (dateFrom) exportParams.dateFrom = new Date(dateFrom).toISOString();
        if (dateTo) exportParams.dateTo = new Date(dateTo).toISOString();
        
        return option.exportFn(exportParams);
      });

      await Promise.all(exportPromises);
      
      toast({
        title: 'Export successful',
        description: 'Your data has been exported successfully.',
      });
      
      setOpen(false);
      setSelectedItems([]);
      setDateFrom('');
      setDateTo('');
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting your data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Select the data you want to export and choose a format.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data to Export</Label>
            <div className="space-y-2">
              {exportOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedItems.includes(option.id)}
                    onCheckedChange={() => toggleItem(option.id)}
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="date-from" className="text-xs">From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="text-xs">To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}