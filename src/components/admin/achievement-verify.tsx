import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Hash,
  Calendar,
  Mail,
} from 'lucide-react';
import { AdminNav } from './admin-layout';

interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  title: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  category: string;
  blockchain_hash: string;
  verification_chain: any[];
  is_publicly_displayed: boolean;
  custom_message?: string;
  awarded_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
}

export function AchievementVerify() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] =
    useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select(`
            *,
            user:user_id (
              email,
              user_metadata
            )
          `)
          .order('awarded_at', { ascending: false });

        if (error) throw error;
        setAchievements(data || []);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  // Filter achievements
  useEffect(() => {
    let filtered = achievements;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.achievement_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'public') {
        filtered = filtered.filter((a) => a.is_publicly_displayed);
      } else if (filterStatus === 'private') {
        filtered = filtered.filter((a) => !a.is_publicly_displayed);
      }
    }

    setFilteredAchievements(filtered);
  }, [achievements, searchTerm, filterStatus]);

  const handleVerify = async (achievement: Achievement, action: 'approve' | 'reject' | 'flag') => {
    setIsVerifying(true);
    try {
      const { error } = await supabase
        .from('admin_logs')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: `achievement_${action}`,
          target_table: 'achievements',
          target_id: achievement.id,
          old_data: achievement,
          new_data: { status: action },
          reason: verificationNotes,
        });

      if (error) throw error;

      // Update achievement visibility
      if (action === 'approve') {
        await supabase
          .from('achievements')
          .update({ is_publicly_displayed: true })
          .eq('id', achievement.id);
      } else if (action === 'reject') {
        await supabase
          .from('achievements')
          .update({
            is_publicly_displayed: false,
            custom_message: `Rejected: ${verificationNotes}`,
          })
          .eq('id', achievement.id);
      }

      // Refresh achievements
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .order('awarded_at', { ascending: false });
      setAchievements(data || []);

      setShowDetailDialog(false);
      setVerificationNotes('');
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const rarityColors: Record<string, string> = {
    common: 'bg-slate-100 text-slate-800',
    rare: 'bg-blue-100 text-blue-800',
    epic: 'bg-purple-100 text-purple-800',
    legendary: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-6">
      <AdminNav />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by title, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Achievements</p>
          <p className="text-2xl font-bold text-blue-900">{achievements.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Public</p>
          <p className="text-2xl font-bold text-green-900">
            {achievements.filter((a) => a.is_publicly_displayed).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-700 font-medium">Private</p>
          <p className="text-2xl font-bold text-red-900">
            {achievements.filter((a) => !a.is_publicly_displayed).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Points Awarded</p>
          <p className="text-2xl font-bold text-purple-900">
            {achievements.reduce((sum, a) => sum + a.points, 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Achievement
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                User
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Rarity
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Awarded
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading achievements...
                </td>
              </tr>
            ) : filteredAchievements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No achievements found
                </td>
              </tr>
            ) : (
              filteredAchievements.map((achievement) => (
                <tr
                  key={achievement.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {achievement.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {achievement.achievement_id}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {achievement.user?.email || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={rarityColors[achievement.rarity]}>
                      {achievement.rarity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {achievement.is_publicly_displayed ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Public</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-600">
                        <XCircle className="w-4 h-4" />
                        <span>Private</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      {new Date(achievement.awarded_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAchievement(achievement);
                        setShowDetailDialog(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Achievement Details</DialogTitle>
            <DialogDescription>
              Verify and manage achievement
            </DialogDescription>
          </DialogHeader>

          {selectedAchievement && (
            <div className="space-y-4 py-4">
              {/* Achievement Info */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Title
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedAchievement.title}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-600 uppercase">
                      Category
                    </p>
                    <p className="text-slate-900">
                      {selectedAchievement.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 uppercase">
                      Rarity
                    </p>
                    <Badge className={rarityColors[selectedAchievement.rarity]}>
                      {selectedAchievement.rarity}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Points
                  </p>
                  <p className="text-slate-900">{selectedAchievement.points}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-200">
                <p className="text-xs font-medium text-blue-700 uppercase">
                  User Information
                </p>
                <p className="text-slate-900">
                  {selectedAchievement.user?.email || 'Unknown'}
                </p>
              </div>

              {/* Blockchain Hash */}
              <div className="bg-purple-50 p-4 rounded-lg space-y-2 border border-purple-200">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-700 uppercase">
                    Blockchain Hash
                  </p>
                </div>
                <code className="block text-xs bg-white p-2 rounded border border-purple-200 font-mono text-purple-900 overflow-x-auto">
                  {selectedAchievement.blockchain_hash}
                </code>
              </div>

              {/* Verification Status */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="text-xs font-medium text-slate-600 uppercase">
                  Current Status
                </p>
                {selectedAchievement.is_publicly_displayed ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Publicly Displayed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-600">
                    <XCircle className="w-5 h-5" />
                    <span>Private</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-700 uppercase mb-2 block">
                  Verification Notes
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add notes about your verification decision..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Error or Message */}
              {selectedAchievement.custom_message && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Custom Message
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">
                      {selectedAchievement.custom_message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
              disabled={isVerifying}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handleVerify(selectedAchievement!, 'reject')
              }
              disabled={isVerifying}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() =>
                handleVerify(selectedAchievement!, 'approve')
              }
              disabled={isVerifying}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
