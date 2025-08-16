import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { ProfileForm, PasswordForm, SettingsForm, DangerZone } from '@/components/profile';
import { Card } from '@/components/ui/Card';
import { User, Lock, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';

type TabType = 'profile' | 'password' | 'settings' | 'danger';

export function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'プロフィール', icon: User },
    { id: 'password' as const, label: 'パスワード', icon: Lock },
    { id: 'settings' as const, label: '設定', icon: Settings },
    { id: 'danger' as const, label: 'アカウント管理', icon: Shield },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            アカウント設定
          </h1>
          <p className="text-muted-foreground mt-2">プロフィールと設定を管理します</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-accent text-muted-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {activeTab === 'profile' && <ProfileForm />}
              {activeTab === 'password' && <PasswordForm />}
              {activeTab === 'settings' && <SettingsForm />}
              {activeTab === 'danger' && <DangerZone />}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
