import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useWebRTCAudio } from '@/hooks/webRTCAudio';
import { useRoomContext } from '/context/RoomContext';

const AudioIndicator = () => {
    const { isRoomActive, room} = useRoomContext();
    const {
        isMuted,
        isConnected,
        audioLevel,
        setAudioLevel,
        connectedPeers,
        handleToggleMute,
        userInteracted
    } = useWebRTCAudio(room, isRoomActive);

    // // Simulate audio level changes for demo purposes
    // React.useEffect(() => {
    //     if (!isMuted) {
    //         const interval = setInterval(() => {
    //             setAudioLevel(prev => {
    //                 const change = Math.random() * 40 - 20;
    //                 return Math.max(0, Math.min(100, prev + change));
    //             });
    //         }, 100);
    //         return () => clearInterval(interval);
    //     } else {
    //         setAudioLevel(0);
    //     }
    // }, [isMuted]);

    return (
        <div className="relative flex items-center justify-center w-10 h-10">
            {/* Voice level indicator circles */}
            {!isMuted && audioLevel > 0 && (
                <>
                    <div
                        className="absolute rounded-full bg-green-500/10 backdrop-blur-sm transition-all duration-200"
                        style={{
                            width: `${80 + audioLevel * 0.4}px`,
                            height: `${80 + audioLevel * 0.4}px`,
                        }}
                    />
                    <div
                        className="absolute rounded-full bg-green-500/5 backdrop-blur-sm transition-all duration-200"
                        style={{
                            width: `${100 + audioLevel * 0.6}px`,
                            height: `${100 + audioLevel * 0.6}px`,
                        }}
                    />
                </>
            )}

            {/* Main button */}
            <button
                onClick={handleToggleMute}
                className={`relative p-1 rounded-full transition-all duration-200 ${isMuted
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    : 'bg-green-50 hover:bg-green-100 text-green-600'
                    }`}
            >
                {isMuted ? (
                    <MicOff className="w-6 h-6" />
                ) : (
                    <Mic className="w-7 h-7" />
                )}
            </button>
        </div>
    );
};

export default AudioIndicator;