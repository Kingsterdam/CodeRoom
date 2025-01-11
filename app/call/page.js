'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const Call = () => {
    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);
    const [localVoiceActive, setLocalVoiceActive] = useState(false);
    const [remoteVoiceActive, setRemoteVoiceActive] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [localAudioLevel, setLocalAudioLevel] = useState(0);
    const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

    useEffect(() => {
        socketRef.current = io('http://localhost:3010', {
            withCredentials: true
        });

        peerConnectionRef.current = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('signal', {
                    signal: { type: 'ice', candidate: event.candidate },
                    roomId: 'room1'
                });
            }
        };

        peerConnectionRef.current.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnectionRef.current.connectionState);
            setIsConnected(peerConnectionRef.current.connectionState === 'connected');
        };

        peerConnectionRef.current.ontrack = (event) => {
            console.log('Received remote track');
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
                setupVoiceDetection(event.streams[0], false);
            }
        };

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                if (localAudioRef.current) {
                    localAudioRef.current.srcObject = stream;
                    stream.getTracks().forEach((track) => {
                        peerConnectionRef.current.addTrack(track, stream);
                    });
                    setupVoiceDetection(stream, true);
                }
            })
            .catch((error) => console.error('Error accessing media devices:', error));

        socketRef.current.on('signal', async ({ signal, from }) => {
            try {
                if (signal.type === 'offer') {
                    console.log('Received offer');
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await peerConnectionRef.current.createAnswer();
                    await peerConnectionRef.current.setLocalDescription(answer);
                    socketRef.current.emit('signal', {
                        signal: answer,
                        roomId: 'room1'
                    });
                }
                else if (signal.type === 'answer') {
                    console.log('Received answer');
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                }
                else if (signal.type === 'ice') {
                    console.log('Received ICE candidate');
                    if (peerConnectionRef.current.remoteDescription) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    }
                }
            } catch (error) {
                console.error('Error processing signal:', error);
            }
        });

        return () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const setupVoiceDetection = (stream, isLocal) => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudioActivity = () => {
            analyser.getByteFrequencyData(dataArray);
            const audioLevel = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            
            if (isLocal) {
                setLocalVoiceActive(audioLevel > 20);
                setLocalAudioLevel(Math.min(100, (audioLevel / 50) * 100));
            } else {
                setRemoteVoiceActive(audioLevel > 20);
                setRemoteAudioLevel(Math.min(100, (audioLevel / 50) * 100));
            }
            requestAnimationFrame(checkAudioActivity);
        };
        checkAudioActivity();
    };

    const joinRoom = async () => {
        console.log('Joining room...');
        socketRef.current.emit('join', 'room1');

        try {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            socketRef.current.emit('signal', {
                signal: offer,
                roomId: 'room1'
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    };

    return (
        <div className="flex flex-col items-center p-6 space-y-6">
            <h1 className="text-2xl font-bold">Audio Call</h1>
            
            <div className="flex flex-col items-center space-y-4">
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
                
                {/* Local Audio Indicator */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="text-sm font-medium">Your Voice</div>
                    <div className="relative w-48 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="absolute h-full bg-blue-500 transition-all duration-100"
                            style={{ width: `${localAudioLevel}%` }}
                        />
                    </div>
                    <div
                        className={`w-12 h-12 rounded-full transition-colors duration-300 ${
                            localVoiceActive ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        title={localVoiceActive ? 'Your Voice Active' : 'Your Voice Inactive'}
                    />
                </div>

                {/* Remote Audio Indicator */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="text-sm font-medium">Remote Voice</div>
                    <div className="relative w-48 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="absolute h-full bg-green-500 transition-all duration-100"
                            style={{ width: `${remoteAudioLevel}%` }}
                        />
                    </div>
                    <div
                        className={`w-12 h-12 rounded-full transition-colors duration-300 ${
                            remoteVoiceActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={remoteVoiceActive ? 'Remote Voice Active' : 'Remote Voice Inactive'}
                    />
                </div>

                <div className={`text-sm ${isConnected ? 'text-green-500' : 'text-gray-500'}`}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                </div>
            </div>

            <button
                onClick={joinRoom}
                className="px-6 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            >
                Join Room
            </button>
        </div>
    );
};

export default Call;