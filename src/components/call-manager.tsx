/**
 * Call Manager Component
 * 
 * Aramaları başlat, yönet, geçmişini göster
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Share2,
  Plus,
} from 'lucide-react';
import {
  CallSession,
  CallParticipant,
  CallStatus,
  CallType,
} from '@/lib/advanced-features-types';

interface CallManagerProps {
  activeCall?: CallSession;
  callHistory?: CallSession[];
  onInitiateCall: (callType: CallType, recipientId?: string) => Promise<CallSession>;
  onEndCall: (callId: string) => Promise<void>;
  onToggleAudio?: (callId: string, enabled: boolean) => Promise<void>;
  onToggleVideo?: (callId: string, enabled: boolean) => Promise<void>;
  onAddParticipant?: (callId: string, userId: string) => Promise<void>;
}

export function CallManager({
  activeCall,
  callHistory,
  onInitiateCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onAddParticipant,
}: CallManagerProps) {
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [callType, setCallType] = useState<CallType>('direct');
  const [recipientId, setRecipientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call duration timer
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'ongoing') return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall]);

  const handleInitiateCall = async () => {
    if (!recipientId.trim() && callType === 'direct') {
      alert('Alıcı ID giriniz');
      return;
    }

    setIsLoading(true);
    try {
      await onInitiateCall(callType, recipientId || undefined);
      setRecipientId('');
      setIsCreatingCall(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    setIsLoading(true);
    try {
      await onEndCall(activeCall.id);
      setCallDuration(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Active Call */}
      {activeCall && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Aktif Arama
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {activeCall.call_type} araması
            </p>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-lg font-mono font-semibold text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
            {formatDuration(callDuration)}
          </div>

          {/* Participants */}
          {activeCall.participants && activeCall.participants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Katılımcılar ({activeCall.participants.length})
              </p>
              <div className="space-y-1">
                {activeCall.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        p.is_active ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {p.participant_id}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      {p.audio_enabled ? (
                        <Mic className="w-3 h-3 text-green-600" />
                      ) : (
                        <MicOff className="w-3 h-3 text-red-600" />
                      )}
                      {p.video_enabled ? (
                        <Video className="w-3 h-3 text-green-600" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                onToggleAudio?.(activeCall.id, !audioEnabled);
              }}
              variant={audioEnabled ? 'default' : 'destructive'}
              size="sm"
            >
              {audioEnabled ? (
                <Mic className="w-4 h-4 mr-1" />
              ) : (
                <MicOff className="w-4 h-4 mr-1" />
              )}
              Mikrofon
            </Button>

            <Button
              onClick={() => {
                setVideoEnabled(!videoEnabled);
                onToggleVideo?.(activeCall.id, !videoEnabled);
              }}
              variant={videoEnabled ? 'default' : 'outline'}
              size="sm"
            >
              {videoEnabled ? (
                <Video className="w-4 h-4 mr-1" />
              ) : (
                <VideoOff className="w-4 h-4 mr-1" />
              )}
              Kamera
            </Button>

            {activeCall.call_type !== 'direct' && (
              <Button
                onClick={() => {
                  const userId = prompt('Eklenecek kullanıcı ID:');
                  if (userId) {
                    onAddParticipant?.(activeCall.id, userId);
                  }
                }}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ekle
              </Button>
            )}

            <Button
              onClick={handleEndCall}
              variant="destructive"
              size="sm"
              disabled={isLoading}
            >
              <PhoneOff className="w-4 h-4 mr-1" />
              Bitir
            </Button>
          </div>

          {activeCall.recorded && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded p-2 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Kaydediliyor...
            </div>
          )}
        </div>
      )}

      {/* Create New Call */}
      {!activeCall && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {isCreatingCall ? 'Yeni Arama Başlat' : 'Aramaları Yönet'}
          </h3>

          {!isCreatingCall ? (
            <Button
              onClick={() => setIsCreatingCall(true)}
              className="w-full"
            >
              <Phone className="w-4 h-4 mr-2" />
              Yeni Arama Başlat
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Arama Tipi</label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value as CallType)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
                  disabled={isLoading}
                >
                  <option value="direct">Bire Bir Arama</option>
                  <option value="group">Grup Araması</option>
                  <option value="conference">Konferans</option>
                  <option value="webinar">Webinar</option>
                </select>
              </div>

              {callType === 'direct' && (
                <div>
                  <label className="text-sm font-medium block mb-1">Alıcı ID</label>
                  <Input
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="Kullanıcı ID giriniz"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsCreatingCall(false);
                    setRecipientId('');
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleInitiateCall}
                  disabled={isLoading || (callType === 'direct' && !recipientId.trim())}
                  size="sm"
                  className="flex-1"
                >
                  {isLoading ? 'Başlatılıyor...' : 'Başlat'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call History */}
      {callHistory && callHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Arama Geçmişi
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {callHistory.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {call.call_type}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(call.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {call.duration_seconds && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.floor(call.duration_seconds / 60)}m
                    </span>
                  )}

                  {call.status === 'ended' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
