import { useState, useRef } from 'react';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useUser';
import { Button } from '@/components/ui';
import { User, Mail, FileText, Camera, Loader } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
  });

  // Initialize form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || '',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }
      
      uploadAvatar.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className={cn(
            "w-24 h-24 rounded-full overflow-hidden",
            "bg-muted",
            "border-4 border-background",
            "shadow-lg cursor-pointer"
          )}>
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAvatarClick}
            className={cn(
              "absolute inset-0 rounded-full",
              "bg-black/50 opacity-0 group-hover:opacity-100",
              "flex items-center justify-center",
              "transition-opacity"
            )}
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">プロフィール画像</h3>
          <p className="text-sm text-muted-foreground mt-1">
            JPG、PNG、GIF形式（最大5MB）
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            ユーザー名
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={cn(
                "w-full pl-10 pr-3 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={cn(
                "w-full pl-10 pr-3 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            自己紹介
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className={cn(
                "w-full pl-10 pr-3 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "resize-none"
              )}
              placeholder="自己紹介を入力..."
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            最大500文字
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? '保存中...' : 'プロフィールを保存'}
        </Button>
      </div>
    </form>
  );
}