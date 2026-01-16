/**
 * Meeting Scheduler Component
 * 
 * Toplantıları planla, katılımcıları yönet, kaydı izle
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  Edit2,
  Video,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ScheduledMeeting, MeetingParticipant } from '@/lib/advanced-features-types';

interface MeetingSchedulerProps {
  meetings?: ScheduledMeeting[];
  onCreateMeeting?: (
    title: string,
    startTime: string,
    endTime: string,
    description?: string,
    recurrence?: string
  ) => Promise<void>;
  onDeleteMeeting?: (meetingId: string) => Promise<void>;
  onAddParticipant?: (meetingId: string, email: string, name?: string) => Promise<void>;
  onRemoveParticipant?: (meetingId: string, participantId: string) => Promise<void>;
  onRecordMeeting?: (meetingId: string) => Promise<void>;
}

export function MeetingScheduler({
  meetings = [],
  onCreateMeeting,
  onDeleteMeeting,
  onAddParticipant,
  onRemoveParticipant,
  onRecordMeeting,
}: MeetingSchedulerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ScheduledMeeting | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState('once');
  const [isLoading, setIsLoading] = useState(false);
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantName, setParticipantName] = useState('');

  const handleCreateMeeting = async () => {
    if (!title.trim() || !startTime || !endTime) {
      alert('Lütfen başlık ve saatleri giriniz');
      return;
    }

    if (!onCreateMeeting) {
      alert('Toplantı oluşturma özelliği henüz aktif değil');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateMeeting(title, startTime, endTime, description, recurrence);
      setTitle('');
      setStartTime('');
      setEndTime('');
      setDescription('');
      setRecurrence('once');
      setIsCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Bu toplantıyı silmek istediğinize emin misiniz?')) return;

    setIsLoading(true);
    try {
      await onDeleteMeeting?.(meetingId);
      setSelectedMeeting(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedMeeting || !participantEmail.trim()) return;

    setIsLoading(true);
    try {
      await onAddParticipant?.(selectedMeeting.id, participantEmail, participantName);
      setParticipantEmail('');
      setParticipantName('');
    } finally {
      setIsLoading(false);
    }
  };

  const getUpcomingMeetings = () => {
    return meetings.filter((m) => new Date(m.start_time) > new Date());
  };

  const getPastMeetings = () => {
    return meetings.filter((m) => new Date(m.start_time) <= new Date());
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Toplantı Planlayıcısı
        </h2>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          variant={isCreating ? 'default' : 'outline'}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Yeni
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Başlık</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Toplantı başlığı"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium block mb-1">Başlangıç</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Bitiş</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Tekrar</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
              disabled={isLoading}
            >
              <option value="once">Bir Kez</option>
              <option value="daily">Günlük</option>
              <option value="weekly">Haftalık</option>
              <option value="biweekly">İki Haftalık</option>
              <option value="monthly">Aylık</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Açıklama (İsteğe Bağlı)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Toplantı gündemi..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsCreating(false)}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={handleCreateMeeting}
              disabled={isLoading || !title.trim()}
              size="sm"
              className="flex-1"
            >
              {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Upcoming Meetings */}
        {getUpcomingMeetings().length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Yaklaşan Toplantılar
            </h3>
            <div className="space-y-2">
              {getUpcomingMeetings().map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => setSelectedMeeting(meeting)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedMeeting?.id === meeting.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {meeting.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(meeting.start_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.participants?.length || 0} kişi
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                      Yaklaşan
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Past Meetings */}
        {getPastMeetings().length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Geçmiş Toplantılar
            </h3>
            <div className="space-y-2">
              {getPastMeetings().map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => setSelectedMeeting(meeting)}
                  className="w-full text-left p-3 rounded-lg border bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {meeting.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatDateTime(meeting.start_time)}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      Tamamlandı
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {meetings.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz toplantı yok</p>
          </div>
        )}
      </div>

      {/* Meeting Details */}
      {selectedMeeting && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Toplantı Detayları
            </h3>
            <Button
              onClick={() => handleDeleteMeeting(selectedMeeting.id)}
              variant="outline"
              size="sm"
              className="text-red-600"
              disabled={isLoading}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs space-y-1">
            {selectedMeeting.description && (
              <p className="text-gray-700 dark:text-gray-300">{selectedMeeting.description}</p>
            )}
            <p className="text-gray-600 dark:text-gray-400 capitalize">
              Tekrar: {selectedMeeting.recurrence}
            </p>
          </div>

          {/* Participants */}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Katılımcılar ({selectedMeeting.participants?.length || 0})
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {selectedMeeting.participants?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-900 rounded text-xs"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {p.name || p.email}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {p.rsvp_status}
                    </p>
                  </div>
                  <Button
                    onClick={() => onRemoveParticipant?.(selectedMeeting.id, p.id)}
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Participant */}
          <div className="space-y-2">
            <Input
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              placeholder="E-posta adresi"
              type="email"
              disabled={isLoading}
              size="sm"
              className="text-sm"
            />
            <Input
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Ad (isteğe bağlı)"
              disabled={isLoading}
              size="sm"
              className="text-sm"
            />
            <Button
              onClick={handleAddParticipant}
              variant="outline"
              size="sm"
              disabled={isLoading || !participantEmail.trim()}
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              Katılımcı Ekle
            </Button>
          </div>

          {/* Recording */}
          {new Date(selectedMeeting.start_time) <= new Date() && (
            <Button
              onClick={() => onRecordMeeting?.(selectedMeeting.id)}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="w-full"
            >
              <Video className="w-3 h-3 mr-1" />
              Kayda Başla
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
