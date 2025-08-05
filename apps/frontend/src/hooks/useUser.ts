import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, UserProfile, UserSettings, UpdateProfileDto, UpdatePasswordDto } from '@/lib/user-api';
import { toast } from 'react-hot-toast';

export function useProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateProfileDto) => userApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['user-profile'], updatedProfile);
      toast.success('プロフィールを更新しました');
    },
    onError: () => {
      toast.error('プロフィールの更新に失敗しました');
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: (data) => {
      // Update the profile with new avatar URL
      const currentProfile = queryClient.getQueryData<UserProfile>(['user-profile']);
      if (currentProfile) {
        queryClient.setQueryData(['user-profile'], {
          ...currentProfile,
          avatar: data.url,
        });
      }
      toast.success('アバターを更新しました');
    },
    onError: () => {
      toast.error('アバターのアップロードに失敗しました');
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordDto) => userApi.updatePassword(data),
    onSuccess: () => {
      toast.success('パスワードを更新しました');
    },
    onError: () => {
      toast.error('パスワードの更新に失敗しました');
    },
  });
}

export function useUserSettings() {
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: () => userApi.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<UserSettings>) => userApi.updateSettings(settings),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['user-settings'], updatedSettings);
      
      // Apply theme if changed
      if (updatedSettings.theme) {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (updatedSettings.theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(updatedSettings.theme);
        }
      }
      
      toast.success('設定を保存しました');
    },
    onError: () => {
      toast.error('設定の保存に失敗しました');
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) => userApi.deleteAccount(password),
    onSuccess: () => {
      // Redirect to login after account deletion
      window.location.href = '/login';
    },
    onError: () => {
      toast.error('アカウントの削除に失敗しました');
    },
  });
}