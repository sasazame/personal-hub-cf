import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

export function Profile() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</h3>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">{user?.username}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}