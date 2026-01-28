'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Building2, User, Lock } from 'lucide-react';
import { Account, CorporateAccount } from '@/lib/initial-content';
import { PinVerificationModal } from './pin-verification-modal';

interface ProfileSelectionScreenProps {
  onProfileSelect: (accountId: string) => void;
  onAddProfile?: () => void;
  onManageProfiles?: () => void;
  isManageMode?: boolean;
}

export function ProfileSelectionScreen({
  onProfileSelect,
  onAddProfile,
  onManageProfiles,
  isManageMode = false
}: ProfileSelectionScreenProps) {
  const { 
    user,
    username,
    accounts,
    corporateAccounts
  } = useAppStore();

  const [selectedAccountForPin, setSelectedAccountForPin] = useState<Account | CorporateAccount | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Combine all accounts
  const allAccounts = [...accounts, ...corporateAccounts];
  
  // Create default account if none exist
  const displayAccounts: (Account | CorporateAccount)[] = allAccounts.length > 0 
    ? allAccounts 
    : [{
        id: 'default',
        name: username || user?.email?.split('@')[0] || 'Kullanıcı',
        type: 'personal' as const,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle profile click
  const handleProfileClick = (account: Account | CorporateAccount) => {
    // Check if PIN is required (mock check - in real app, check account.pin_enabled from DB)
    const hasPinEnabled = false; // TODO: Get from user_accounts table
    
    if (hasPinEnabled && !isManageMode) {
      setSelectedAccountForPin(account);
      setShowPinModal(true);
    } else {
      onProfileSelect(account.id);
    }
  };

  // Handle PIN verification
  const handlePinVerify = async (pin: string): Promise<boolean> => {
    // TODO: Verify PIN against database
    // For now, mock verification (any 4-digit PIN works)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (pin.length === 4) {
      setShowPinModal(false);
      if (selectedAccountForPin) {
        onProfileSelect(selectedAccountForPin.id);
      }
      return true;
    }
    return false;
  };

  // Profile card colors
  const profileColors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-yellow-500 to-orange-500',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Canvas
          </span>
          <span className="text-white">Flow</span>
        </h1>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-2xl md:text-3xl font-medium text-white mb-8"
      >
        {isManageMode ? 'Profilleri Yönet' : 'Kim izliyor?'}
      </motion.h2>

      {/* Profiles Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-4xl"
      >
        <AnimatePresence>
          {displayAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex flex-col items-center"
            >
              <button
                onClick={() => handleProfileClick(account)}
                onMouseEnter={() => setHoveredId(account.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative group"
              >
                {/* Avatar */}
                <div 
                  className={cn(
                    "relative rounded-lg overflow-hidden transition-all duration-300",
                    "w-24 h-24 md:w-32 md:h-32",
                    hoveredId === account.id ? "ring-4 ring-white scale-105" : "ring-0"
                  )}
                >
                  <Avatar className="w-full h-full rounded-lg">
                    <AvatarImage 
                      src={account.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${account.name}&backgroundColor=transparent`} 
                      alt={account.name}
                      className="object-cover"
                    />
                    <AvatarFallback 
                      className={cn(
                        "text-2xl md:text-3xl font-bold text-white rounded-lg",
                        `bg-gradient-to-br ${profileColors[index % profileColors.length]}`
                      )}
                    >
                      {getInitials(account.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Account Type Badge */}
                  <div 
                    className={cn(
                      "absolute bottom-1 right-1 p-1 rounded-full",
                      account.type === 'corporate' ? "bg-blue-500" : "bg-purple-500"
                    )}
                  >
                    {account.type === 'corporate' ? (
                      <Building2 className="h-3 w-3 text-white" />
                    ) : (
                      <User className="h-3 w-3 text-white" />
                    )}
                  </div>

                  {/* PIN Lock Icon - show if PIN enabled */}
                  {/* TODO: Check actual pin_enabled from database */}

                  {/* Edit Overlay in Manage Mode */}
                  {isManageMode && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <motion.p
                  className={cn(
                    "mt-3 text-sm md:text-base text-center transition-colors duration-300",
                    hoveredId === account.id ? "text-white" : "text-slate-400"
                  )}
                >
                  {account.name}
                </motion.p>

                {/* Corporate Label */}
                {account.type === 'corporate' && (
                  <span className="text-xs text-blue-400 mt-0.5">
                    Kurumsal
                  </span>
                )}
              </button>
            </motion.div>
          ))}

          {/* Add Profile Button */}
          {onAddProfile && displayAccounts.length < 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: displayAccounts.length * 0.05 }}
              className="flex flex-col items-center"
            >
              <button
                onClick={onAddProfile}
                onMouseEnter={() => setHoveredId('add')}
                onMouseLeave={() => setHoveredId(null)}
                className="relative group"
              >
                <div 
                  className={cn(
                    "w-24 h-24 md:w-32 md:h-32 rounded-lg",
                    "bg-slate-800 border-2 border-slate-600 border-dashed",
                    "flex items-center justify-center",
                    "transition-all duration-300",
                    hoveredId === 'add' ? "border-white bg-slate-700 scale-105" : ""
                  )}
                >
                  <Plus 
                    className={cn(
                      "h-12 w-12 transition-colors duration-300",
                      hoveredId === 'add' ? "text-white" : "text-slate-500"
                    )} 
                  />
                </div>
                <p 
                  className={cn(
                    "mt-3 text-sm md:text-base text-center transition-colors duration-300",
                    hoveredId === 'add' ? "text-white" : "text-slate-400"
                  )}
                >
                  Profil Ekle
                </p>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Manage Profiles Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12"
      >
        <Button
          variant="outline"
          onClick={onManageProfiles}
          className={cn(
            "px-6 py-2 text-sm font-medium",
            "border-slate-600 text-slate-400 hover:text-white hover:border-white",
            "bg-transparent hover:bg-white/5"
          )}
        >
          {isManageMode ? 'Bitti' : 'Profilleri Yönet'}
        </Button>
      </motion.div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setSelectedAccountForPin(null);
        }}
        onVerify={handlePinVerify}
        accountName={selectedAccountForPin?.name || ''}
        accountAvatar={selectedAccountForPin?.avatar}
        title="PIN Kodunu Girin"
        description="Bu profile erişmek için PIN kodunuzu girin."
      />
    </div>
  );
}

export default ProfileSelectionScreen;
