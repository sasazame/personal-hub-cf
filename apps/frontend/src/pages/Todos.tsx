import { AppLayout } from '@/components/layout';

export function Todos() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TODOs</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">TODO list will be implemented here</p>
        </div>
      </div>
    </AppLayout>
  );
}