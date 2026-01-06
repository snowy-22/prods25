/**
 * WebRTC Video/Audio Call Component
 * Real-time video and audio calling with screen sharing
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Maximize2,
  Minimize2,
  Users,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeCall } from '@/lib/supabase-realtime';

interface WebRTCCallProps {
  callId: string;
  isOpen: boolean;
  onClose: () => void;
  onEndCall: () => void;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  stream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

export default function WebRTCCall({ callId, isOpen, onClose, onEndCall }: WebRTCCallProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const { call } = useRealtimeCall(callId);

  // ICE servers configuration (STUN/TURN)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Update call participant status
        const supabase = createClient();
        const user = (await supabase.auth.getUser()).data.user;
        if (user && callId) {
          await supabase.from('call_participants').upsert({
            call_id: callId,
            user_id: user.id,
            is_audio_enabled: true,
            is_video_enabled: true,
            is_screen_sharing: false,
          });
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    if (isOpen) {
      initializeMedia();
    }

    return () => {
      // Cleanup: stop all tracks
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [isOpen, callId]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);

        // Update database
        const supabase = createClient();
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase
            .from('call_participants')
            .update({ is_video_enabled: videoTrack.enabled })
            .eq('call_id', callId)
            .eq('user_id', user.id);
        }
      }
    }
  }, [localStream, callId]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);

        // Update database
        const supabase = createClient();
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase
            .from('call_participants')
            .update({ is_audio_enabled: audioTrack.enabled })
            .eq('call_id', callId)
            .eq('user_id', user.id);
        }
      }
    }
  }, [localStream, callId]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);

        // Handle screen share stop
        videoTrack.onended = () => {
          toggleScreenShare();
        };

        // Update database
        const supabase = createClient();
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase
            .from('call_participants')
            .update({ is_screen_sharing: true })
            .eq('call_id', callId)
            .eq('user_id', user.id);
        }
      } else {
        // Stop screen sharing, return to camera
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          peerConnections.current.forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
        }

        setIsScreenSharing(false);

        // Update database
        const supabase = createClient();
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase
            .from('call_participants')
            .update({ is_screen_sharing: false })
            .eq('call_id', callId)
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  }, [isScreenSharing, localStream, callId]);

  // End call
  const handleEndCall = useCallback(async () => {
    // Stop all tracks
    localStream?.getTracks().forEach(track => track.stop());
    
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Update call status
    const supabase = createClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (user && callId) {
      await supabase
        .from('call_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('call_id', callId)
        .eq('user_id', user.id);

      // If initiator, end call
      if (call?.initiatorId === user.id) {
        const supabase = createClient();
        await supabase
          .from('calls')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('id', callId);
      }
    }

    onEndCall();
    onClose();
  }, [localStream, callId, call, onEndCall, onClose]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[90vh] sm:h-[90vh] p-0 overflow-hidden">
        <div className="h-full flex flex-col bg-gray-900">
          {/* Header */}
          <DialogHeader className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white flex items-center gap-2">
                <Video className="h-5 w-5" />
                {call?.type === 'video' ? 'Video Call' : 'Voice Call'}
              </DialogTitle>
              <div className="flex items-center gap-2 text-white text-sm">
                <Users className="h-4 w-4" />
                <span>{participants.length + 1} participants</span>
              </div>
            </div>
          </DialogHeader>

          {/* Video Grid */}
          <div className="flex-1 p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
            {/* Local video */}
            <Card className="relative aspect-video bg-gray-800 overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  !isVideoEnabled && "hidden"
                )}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    You
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
                You {isScreenSharing && '(Sharing)'}
              </div>
              {!isAudioEnabled && (
                <div className="absolute top-2 right-2 p-2 bg-red-500 rounded-full">
                  <MicOff className="h-4 w-4 text-white" />
                </div>
              )}
            </Card>

            {/* Remote participants */}
            {participants.map((participant) => (
              <Card key={participant.id} className="relative aspect-video bg-gray-800 overflow-hidden">
                {participant.stream && participant.isVideoEnabled ? (
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(el) => {
                      if (el && participant.stream) {
                        el.srcObject = participant.stream;
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {participant.name[0]}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
                  {participant.name}
                </div>
                {!participant.isAudioEnabled && (
                  <div className="absolute top-2 right-2 p-2 bg-red-500 rounded-full">
                    <MicOff className="h-4 w-4 text-white" />
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isAudioEnabled ? 'secondary' : 'destructive'}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isVideoEnabled ? 'secondary' : 'destructive'}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleVideo}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isScreenSharing ? 'default' : 'secondary'}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
