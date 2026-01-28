'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Plus, 
  Building2, 
  User, 
  Settings, 
  LogOut,
  Check,
  Users,
  CreditCard,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Account, CorporateAccount } from '@/lib/initial-content';

interface AccountSwitcherProps {
  className?: string;
  showAddAccount?: boolean;
  onAddAccount?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}

export function AccountSwitcher({ 
  className,
  showAddAccount = true,
  onAddAccount,
  onSettingsClick,
  onLogout
}: AccountSwitcherProps) {
  const { 
    user,
    username,
    accounts,
    corporateAccounts,
    currentAccount,
    currentAccountId,
    switchAccount,
    switchToCorporateAccount
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  // Get display name and avatar for current account
  const currentDisplayName = currentAccount?.name || username || user?.email?.split('@')[0] || 'Hesabım';
  const currentAvatar = currentAccount?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentDisplayName}`;
  const currentType = currentAccount?.type || 'personal';

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle account switch
  const handleSwitchAccount = async (account: Account) => {
    if (account.id === currentAccountId) return;
    
    setIsLoading(true);
    try {
      await switchAccount(account.id);
    } catch (error) {
      console.error('Account switch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle corporate account switch
  const handleSwitchCorporate = async (account: CorporateAccount) => {
    if (account.id === currentAccountId) return;
    
    setIsLoading(true);
    try {
      await switchToCorporateAccount(account.id);
    } catch (error) {
      console.error('Corporate account switch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // All available accounts (personal + corporate)
  const allAccounts = [...accounts, ...corporateAccounts];
  const hasMultipleAccounts = allAccounts.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-white/10",
            className
          )}
          disabled={isLoading}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentAvatar} alt={currentDisplayName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
              {getInitials(currentDisplayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium text-white truncate max-w-[120px]">
              {currentDisplayName}
            </span>
            <span className="text-xs text-white/60 flex items-center gap-1">
              {currentType === 'corporate' ? (
                <>
                  <Building2 className="h-3 w-3" />
                  Kurumsal
                </>
              ) : (
                <>
                  <User className="h-3 w-3" />
                  Kişisel
                </>
              )}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-white/60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-slate-900 border-slate-700 text-white"
        sideOffset={8}
      >
        {/* Current Account Header */}
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentAvatar} alt={currentDisplayName} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {getInitials(currentDisplayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentDisplayName}</p>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
              <Badge 
                variant="secondary" 
                className={cn(
                  "mt-1 text-xs",
                  currentType === 'corporate' 
                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" 
                    : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                )}
              >
                {currentType === 'corporate' ? 'Kurumsal Hesap' : 'Kişisel Hesap'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Personal Accounts */}
        {accounts.length > 0 && (
          <>
            <DropdownMenuLabel className="text-slate-400 text-xs font-normal px-3 py-2">
              Kişisel Hesaplar
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {accounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 cursor-pointer",
                    "hover:bg-slate-800 focus:bg-slate-800",
                    account.id === currentAccountId && "bg-slate-800"
                  )}
                  onClick={() => handleSwitchAccount(account)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={account.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${account.name}`} />
                    <AvatarFallback className="bg-purple-500/20 text-purple-300 text-xs">
                      {getInitials(account.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{account.name}</p>
                    {account.email && (
                      <p className="text-xs text-slate-400 truncate">{account.email}</p>
                    )}
                  </div>
                  {account.id === currentAccountId && (
                    <Check className="h-4 w-4 text-green-400" />
                  )}
                  {account.isDefault && account.id !== currentAccountId && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      Varsayılan
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}

        {/* Corporate Accounts */}
        {corporateAccounts.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuLabel className="text-slate-400 text-xs font-normal px-3 py-2 flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              Kurumsal Hesaplar
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {corporateAccounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 cursor-pointer",
                    "hover:bg-slate-800 focus:bg-slate-800",
                    account.id === currentAccountId && "bg-slate-800"
                  )}
                  onClick={() => handleSwitchCorporate(account)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={account.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${account.name}`} />
                    <AvatarFallback className="bg-blue-500/20 text-blue-300 text-xs">
                      {getInitials(account.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{account.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {account.members?.length || 0} üye
                    </p>
                  </div>
                  {account.id === currentAccountId && (
                    <Check className="h-4 w-4 text-green-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* Actions */}
        <DropdownMenuGroup>
          {showAddAccount && (
            <DropdownMenuItem
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              onClick={onAddAccount}
            >
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                <Plus className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-sm">Hesap Ekle</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
            onClick={() => {
              useAppStore.getState().setActiveSecondaryPanel('profile');
            }}
          >
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-sm">Profilim</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
            onClick={onSettingsClick}
          >
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
              <Settings className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-sm">Hesap Ayarları</span>
          </DropdownMenuItem>

          {currentType === 'corporate' && (
            <>
              <DropdownMenuItem
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <Users className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-sm">Ekip Yönetimi</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-sm">Faturalama</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-sm">Güvenlik</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* Logout */}
        <DropdownMenuItem
          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-400"
          onClick={onLogout}
        >
          <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="text-sm">Çıkış Yap</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountSwitcher;
