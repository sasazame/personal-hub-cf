import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommandPalette } from '@/contexts/CommandPaletteContext';
import { Menu, User, LogOut, Settings, ChevronDown, Sun, Moon, Globe, Terminal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { openCommandPalette } = useCommandPalette();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const { t, i18n } = useTranslation('common');
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button 
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md text-foreground hover:bg-muted"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/dashboard" className="ml-2 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">P</span>
              </div>
              <h1 className="hidden md:block text-xl font-semibold text-foreground">
                {t('app.name')}
              </h1>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setIsLanguageModalOpen(true)}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-colors"
              aria-label={t('language.openSelector')}
            >
              <Globe className="h-5 w-5" />
            </button>
            
            {/* Command Palette Button */}
            <button
              onClick={openCommandPalette}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-colors"
              aria-label="Open command palette (Ctrl+K)"
              title="Command Palette (Ctrl+K)"
            >
              <Terminal className="h-5 w-5" />
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-md text-foreground hover:bg-muted"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.username || 'User'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      {t('navigation.profile')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      {t('navigation.settings')}
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('navigation.logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>

      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setIsLanguageModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
            className="relative bg-card border border-border rounded-lg shadow-lg p-6 w-[90%] max-w-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 id="language-modal-title" className="text-lg font-semibold text-card-foreground">
                {t('language.title')}
              </h2>
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="p-2 rounded-md text-foreground hover:bg-muted"
                aria-label={t('app.close')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{t('app.close')}</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('language.description')}
            </p>
            <div className="space-y-2">
              {[
                { code: 'en', label: t('language.english'), shortLabel: t('language.englishShort') },
                { code: 'ja', label: t('language.japanese'), shortLabel: t('language.japaneseShort') }
              ].map(({ code, label, shortLabel }) => {
                const isActive = i18n.language === code;
                return (
                  <button
                    key={code}
                    onClick={() => {
                      changeLanguage(code);
                      setIsLanguageModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md border transition-colors ${
                      isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">{shortLabel}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsLanguageModalOpen(false)}
              className="mt-4 w-full px-3 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted"
            >
              {t('app.cancel')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
