import { useState } from 'react';
import { useDeleteAccount } from '@/hooks/useUser';
import { Button, Modal } from '@/components/ui';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function DangerZone() {
  const deleteAccount = useDeleteAccount();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    if (confirmText !== 'DELETE') {
      alert('確認テキストが正しくありません');
      return;
    }
    
    deleteAccount.mutate(password);
  };

  return (
    <div className="border border-red-200 dark:border-red-900 rounded-lg p-6 bg-red-50 dark:bg-red-900/10">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            危険な操作
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消すことができません。
          </p>
          
          <Button
            variant="danger"
            onClick={() => setShowModal(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            アカウントを削除
          </Button>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold">アカウントを削除しますか？</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>警告:</strong> この操作により以下のデータがすべて削除されます：
              </p>
              <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                <li>プロフィール情報</li>
                <li>すべてのノート</li>
                <li>すべてのタスク</li>
                <li>すべての目標</li>
                <li>すべてのポモドーロ記録</li>
                <li>その他すべての個人データ</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                パスワードを入力
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "bg-white dark:bg-gray-900",
                  "border border-gray-300 dark:border-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-red-500"
                )}
                placeholder="現在のパスワード"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                確認のため「DELETE」と入力してください
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "bg-white dark:bg-gray-900",
                  "border",
                  confirmText === 'DELETE'
                    ? "border-green-500"
                    : "border-gray-300 dark:border-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-red-500"
                )}
                placeholder="DELETE"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setPassword('');
                setConfirmText('');
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={!password || confirmText !== 'DELETE' || deleteAccount.isPending}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteAccount.isPending ? '削除中...' : 'アカウントを削除'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}