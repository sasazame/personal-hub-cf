import { useState } from 'react';
import { useUpdatePassword } from '@/hooks/useUser';
import { Button } from '@/components/ui';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export function PasswordForm() {
  const updatePassword = useUpdatePassword();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return 'パスワードは8文字以上にしてください';
    }
    if (!/[A-Z]/.test(password)) {
      return 'パスワードには大文字を含めてください';
    }
    if (!/[a-z]/.test(password)) {
      return 'パスワードには小文字を含めてください';
    }
    if (!/[0-9]/.test(password)) {
      return 'パスワードには数字を含めてください';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate new password
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setErrors({ ...errors, newPassword: passwordError });
      return;
    }
    
    // Check passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ ...errors, confirmPassword: 'パスワードが一致しません' });
      return;
    }
    
    // Clear errors
    setErrors({ newPassword: '', confirmPassword: '' });
    
    // Submit
    updatePassword.mutate(
      {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      },
      {
        onSuccess: () => {
          // Clear form
          setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
      }
    );
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">パスワードを変更</h3>
        <p className="text-sm text-muted-foreground mb-6">
          セキュリティのため、定期的にパスワードを変更することをお勧めします
        </p>
      </div>

      <div className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium mb-2">
            現在のパスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className={cn(
                "w-full pl-10 pr-10 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium mb-2">
            新しいパスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => {
                setFormData({ ...formData, newPassword: e.target.value });
                setErrors({ ...errors, newPassword: '' });
              }}
              className={cn(
                "w-full pl-10 pr-10 py-2 rounded-lg",
                "bg-background",
                "border",
                errors.newPassword
                  ? "border-destructive"
                  : "border-border",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-destructive mt-1">
              {errors.newPassword}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            8文字以上、大文字・小文字・数字を含む
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-2">
            新しいパスワード（確認）
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                setErrors({ ...errors, confirmPassword: '' });
              }}
              className={cn(
                "w-full pl-10 pr-10 py-2 rounded-lg",
                "bg-background",
                "border",
                errors.confirmPassword
                  ? "border-destructive"
                  : "border-border",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={updatePassword.isPending}
        >
          {updatePassword.isPending ? '変更中...' : 'パスワードを変更'}
        </Button>
      </div>
    </form>
  );
}