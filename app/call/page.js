'use client'
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Device } from 'mediasoup-client';

const WebRTCTest = () => {
    const [isMuted, setIsMuted] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [connectedPeers, setConnectedPeers] = useState(0);
    const [pendingAudioElements, setPendingAudioElements] = useState([]);
    const [userInteracted, setUserInteracted] = useState(false);

    const socketRef = useRef();
    const deviceRef = useRef();
    const producerTransportRef = useRef();
    const consumerTransportRef = useRef();
    const producerRef = useRef();
    const consumersRef = useRef(new Map());
    const streamRef = useRef();
    const audioContextRef = useRef();
    const analyserRef = useRef();
    const animationFrameRef = useRef();

    useEffect(() => {
        connectToServer();
        return () => cleanup();
    }, []);
    useEffect(() => {
        // Add click listener to document for initial user interaction
        const handleFirstInteraction = () => {
            setUserInteracted(true);
            // Try to play all pending audio elements
            pendingAudioElements.forEach(audioEl => {
                audioEl.play().catch(console.error);
            });
            setPendingAudioElements([]);
            document.removeEventListener('click', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
        };
    }, [pendingAudioElements]);

    const connectToServer = () => {
        console.log('Connecting to server...');
        socketRef.current = io('http://localhost:3002', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to server:', socketRef.current.id);
            setIsConnected(true);
            deviceRef.current = new Device();
            setupWebRTC();
        });

        setupSocketListeners();
    };

    const setupSocketListeners = () => {
        socketRef.current.on('routerRtpCapabilities', async (routerRtpCapabilities) => {
            try {
                console.log('Received router capabilities');
                await deviceRef.current.load({ routerRtpCapabilities });
                console.log('Device loaded successfully');
                socketRef.current.emit('createWebRtcTransport', { sender: true });
            } catch (error) {
                console.error('Error loading device:', error);
            }
        });

        socketRef.current.on('transportCreated', async ({ params, sender }) => {
            try {
                if (sender) {
                    await setupSendTransport(params);
                } else {
                    await setupReceiveTransport(params);
                }
            } catch (error) {
                console.error('Error setting up transport:', error);
            }
        });

        socketRef.current.on('transportConnected', () => {
            console.log('Transport connected successfully');
        });

        socketRef.current.on('newProducer', async ({ producerId }) => {
            console.log('New producer available:', producerId);
            if (consumerTransportRef.current) {
                await consumeAudio(producerId);
            }
        });

        socketRef.current.on('consumerCreated', async (params) => {
            await handleConsumerCreated(params);
        });

        socketRef.current.on('producerClosed', ({ producerId }) => {
            handleProducerClosed(producerId);
        });

        socketRef.current.on('peers', (peers) => {
            console.log('Current peers:', peers);
            setConnectedPeers(peers.length);
        });
    };

    const setupWebRTC = () => {
        socketRef.current.emit('getRouterRtpCapabilities');
    };

    const setupSendTransport = async (params) => {
        producerTransportRef.current = deviceRef.current.createSendTransport(params);

        producerTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await socketRef.current.emit('connectTransport', {
                    transportId: params.id,
                    dtlsParameters
                });
                callback();
            } catch (error) {
                errback(error);
            }
        });

        producerTransportRef.current.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            try {
                socketRef.current.emit('produce', {
                    transportId: producerTransportRef.current.id,
                    kind,
                    rtpParameters
                }, ({ producerId }) => {
                    callback({ id: producerId });
                });
            } catch (error) {
                errback(error);
            }
        });

        // Create receive transport after send transport is set up
        socketRef.current.emit('createWebRtcTransport', { sender: false });
    };

    const setupReceiveTransport = async (params) => {
        consumerTransportRef.current = deviceRef.current.createRecvTransport(params);

        consumerTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await socketRef.current.emit('connectTransport', {
                    transportId: params.id,
                    dtlsParameters
                });
                callback();
            } catch (error) {
                errback(error);
            }
        });
    };

    const consumeAudio = async (producerId) => {
        try {
            socketRef.current.emit('consume', {
                producerId,
                rtpCapabilities: deviceRef.current.rtpCapabilities,
                transportId: consumerTransportRef.current.id
            });
        } catch (error) {
            console.error('Error consuming audio:', error);
        }
    };


    const handleConsumerCreated = async ({ consumerId, producerId, kind, rtpParameters }) => {
        try {
            const consumer = await consumerTransportRef.current.consume({
                id: consumerId,
                producerId,
                kind,
                rtpParameters
            });

            const stream = new MediaStream();
            stream.addTrack(consumer.track);

            const audioEl = new Audio();
            audioEl.srcObject = stream;
            audioEl.autoplay = true;
            audioEl.playsInline = true;

            // Try to play audio based on user interaction state
            if (userInteracted) {
                try {
                    await audioEl.play();
                    console.log('Audio playback started successfully');
                } catch (error) {
                    console.error('Error playing audio:', error);
                }
            } else {
                console.log('Queueing audio element for playback after user interaction');
                setPendingAudioElements(prev => [...prev, audioEl]);
            }

            // Store consumer data
            consumersRef.current.set(producerId, {
                consumer,
                audioElement: audioEl
            });

            setConnectedPeers(consumersRef.current.size);

            // Resume the consumer
            await consumer.resume();
            socketRef.current.emit('resumeConsumer', { consumerId });

            console.log('Consumer setup complete for producer:', producerId);
        } catch (error) {
            console.error('Error setting up consumer:', error);
        }
    };

    const handleToggleMute = async () => {
        try {
            if (isMuted) {
                await initializeAudioContext();
                streamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1, // Mono for better performance
                        sampleRate: 48000, // Standard WebRTC sample rate
                        sampleSize: 16 // Standard WebRTC sample size
                    },
                    video: false
                });

                // Wait for the producer transport to be ready
                if (!producerTransportRef.current) {
                    console.log('Waiting for producer transport to be ready...');
                    await new Promise(resolve => {
                        const checkTransport = setInterval(() => {
                            if (producerTransportRef.current) {
                                clearInterval(checkTransport);
                                resolve();
                            }
                        }, 100);
                    });
                }

                startAudioLevelMonitoring(streamRef.current);

                producerRef.current = await producerTransportRef.current.produce({
                    track: streamRef.current.getAudioTracks()[0],
                    codecOptions: {
                        opusStereo: true,
                        opusDtx: true,
                    }
                });
            } else {
                if (producerRef.current) {
                    producerRef.current.close();
                }
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                setAudioLevel(0);
            }
            setIsMuted(!isMuted);
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    };

    const initializeAudioContext = async () => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
            } catch (error) {
                console.error('Error initializing audio context:', error);
            }
        }
    };

    const startAudioLevelMonitoring = (stream) => {
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) return;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const checkAudioLevel = () => {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
    };

    const cleanup = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (producerRef.current) {
            producerRef.current.close();
        }
        if (producerTransportRef.current) {
            producerTransportRef.current.close();
        }
        if (consumerTransportRef.current) {
            consumerTransportRef.current.close();
        }
        consumersRef.current.forEach(({ consumer, audioElement }) => {
            consumer.close();
            audioElement.remove();
        });
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl mb-4">WebRTC Audio Test</h1>
            {!userInteracted && pendingAudioElements.length > 0 && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                    Click anywhere on the page to enable audio playback
                </div>
            )}
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <div>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
                    <div>Microphone Status: {isMuted ? 'Muted' : 'Active'}</div>
                    <div>Audio Level: {audioLevel.toFixed(2)}</div>
                    <div>Connected Peers: {connectedPeers}</div>
                </div>
                <button
                    onClick={handleToggleMute}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                </button>
                <div className="h-4 w-full bg-gray-200 rounded">
                    <div
                        className="h-full bg-green-500 rounded transition-all duration-100"
                        style={{ width: `${(audioLevel / 255) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default WebRTCTest;