import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mic, MicOff, Monitor, Camera, RotateCcw, Pause, Play } from 'lucide-react';
import { getGeminiClient } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

interface LiveVoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemInstruction?: string;
    userName?: string;
    userBio?: string;
    adultMode?: boolean;
    language?: string;
    modelLanguage?: string;
    isLight?: boolean;
    onSaveMessage?: (userText: string, aiText: string) => void;
    responseLength?: 'brief' | 'balanced' | 'detailed';
    incognito?: boolean;
}

// Gemini-style wave animation
const WaveAnimation = ({ isActive, audioLevel }: { isActive: boolean; audioLevel: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const timeRef = useRef(0);
    const audioRef = useRef(0);

    useEffect(() => {
        audioRef.current = audioLevel;
    }, [audioLevel]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth * 2;
            canvas.height = 300;
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            timeRef.current += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;
            const audio = audioRef.current;
            const intensity = isActive ? 0.3 + audio * 0.7 : 0.1;

            // Draw multiple wave layers
            for (let layer = 0; layer < 3; layer++) {
                const layerOffset = layer * 0.3;
                const alpha = (0.4 - layer * 0.1) * intensity;
                
                ctx.beginPath();
                ctx.moveTo(0, h);
                
                for (let x = 0; x <= w; x += 4) {
                    const normalX = x / w;
                    const wave1 = Math.sin(normalX * 4 + timeRef.current * 2 + layerOffset) * 30;
                    const wave2 = Math.sin(normalX * 6 + timeRef.current * 1.5 + layerOffset) * 20;
                    const wave3 = Math.sin(normalX * 8 + timeRef.current * 3 + layerOffset) * 15;
                    const audioWave = audio * Math.sin(normalX * 10 + timeRef.current * 4) * 40;
                    
                    const y = h - 100 - (wave1 + wave2 + wave3 + audioWave) * intensity;
                    ctx.lineTo(x, y);
                }
                
                ctx.lineTo(w, h);
                ctx.closePath();
                
                const gradient = ctx.createLinearGradient(0, h - 200, 0, h);
                gradient.addColorStop(0, `rgba(34, 211, 238, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(59, 130, 246, ${alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(99, 102, 241, ${alpha * 0.5})`);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isActive]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{ height: 150 }}
        />
    );
};


export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ 
    isOpen, onClose, systemInstruction, userName, userBio, adultMode, language = 'ru', modelLanguage = 'ru', isLight = false, onSaveMessage, responseLength = 'balanced', incognito = false
}) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [isListening, setIsListening] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    
    // Video states
    const [videoMode, setVideoMode] = useState<'none' | 'camera' | 'screen'>('none');
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const sessionRef = useRef<any>(null);
    const isConnectedRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const audioQueueRef = useRef<string[]>([]);
    const isPlayingRef = useRef(false);
    const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const currentUserTextRef = useRef<string>('');
    const currentAiTextRef = useRef<string>('');
    const onSaveMessageRef = useRef(onSaveMessage);
    
    useEffect(() => { onSaveMessageRef.current = onSaveMessage; }, [onSaveMessage]);

    const isRu = language === 'ru';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    useEffect(() => {
        if (isOpen) startSession();
        else stopSession();
        return () => stopSession();
    }, [isOpen]);


    const interruptAISpeech = useCallback(() => {
        if (isSpeakingRef.current) {
            try { currentSourceRef.current?.stop(); } catch {}
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            setIsListening(true);
            setTranscript('');
            setAudioLevel(0);
        }
    }, []);

    const playNextAudio = useCallback(async () => {
        if (isPlayingRef.current || !audioQueueRef.current.length || isPaused) return;
        isPlayingRef.current = true;
        const base64 = audioQueueRef.current.shift()!;
        
        try {
            if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
                playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const ctx = playbackContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            
            let maxVal = 0;
            for (let i = 0; i < dataInt16.length; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
                maxVal = Math.max(maxVal, Math.abs(channelData[i]));
            }
            setAudioLevel(maxVal * 0.7);
            
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            currentSourceRef.current = source;
            
            source.onended = () => {
                isPlayingRef.current = false;
                currentSourceRef.current = null;
                if (audioQueueRef.current.length) playNextAudio();
                else setTimeout(() => {
                    if (!audioQueueRef.current.length) {
                        isSpeakingRef.current = false;
                        setIsSpeaking(false);
                        setIsListening(true);
                        setAudioLevel(0);
                        setTranscript('');
                    }
                }, 300);
            };
            source.start();
        } catch {
            isPlayingRef.current = false;
            playNextAudio();
        }
    }, [isPaused]);


    const startSession = async () => {
        try {
            setStatus('connecting');
            setIsListening(true);
            setTranscript('');
            
            const ai = getGeminiClient();
            if (!ai) { setStatus('error'); return; }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } 
            });
            audioStreamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            inputSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            const LANG_NAMES: Record<string, string> = {
              'ru': 'русском', 'en': 'English', 'uk': 'українською', 'de': 'Deutsch',
              'fr': 'français', 'es': 'español', 'zh': '中文', 'ja': '日本語'
            };
            const langName = LANG_NAMES[modelLanguage] || modelLanguage;
            
            let sysPrompt = systemInstruction || (isRu ? 'Ты голосовой помощник NEO.' : 'You are NEO voice assistant.');
            sysPrompt += isRu 
                ? ` ВАЖНО: Отвечай ТОЛЬКО на языке: ${langName}.`
                : ` IMPORTANT: Respond ONLY in ${langName}.`;
            if (userName) sysPrompt += isRu ? ` Пользователя зовут ${userName}.` : ` User's name is ${userName}.`;
            if (userBio) sysPrompt += isRu ? ` О нём: ${userBio}` : ` About them: ${userBio}`;
            if (adultMode) sysPrompt += isRu ? ' Режим без ограничений.' : ' Unrestricted mode.';
            
            if (responseLength === 'brief') sysPrompt += isRu ? ' Отвечай кратко.' : ' Be brief.';
            else if (responseLength === 'detailed') sysPrompt += isRu ? ' Отвечай подробно.' : ' Be detailed.';

            const SPEECH_LANG_CODES: Record<string, string> = {
                'ru': 'ru-RU', 'en': 'en-US', 'uk': 'uk-UA', 'de': 'de-DE',
                'fr': 'fr-FR', 'es': 'es-ES', 'zh': 'cmn-CN', 'ja': 'ja-JP'
            };
            const speechLangCode = SPEECH_LANG_CODES[modelLanguage] || 'ru-RU';


            const session = await ai.live.connect({
                model: 'gemini-2.0-flash-live-001',
                callbacks: {
                    onopen: () => { 
                        setStatus('connected'); 
                        isConnectedRef.current = true;
                        // Play connect sound
                        try {
                            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                            osc.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.1);
                            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                            osc.start(audioCtx.currentTime);
                            osc.stop(audioCtx.currentTime + 0.3);
                        } catch {}
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const inputTranscript = (msg as any).serverContent?.inputTranscript;
                        if (inputTranscript) currentUserTextRef.current += inputTranscript + ' ';
                        
                        const parts = msg.serverContent?.modelTurn?.parts;
                        if (parts) {
                            for (const part of parts) {
                                if (part.text) {
                                    setTranscript(prev => prev + part.text);
                                    currentAiTextRef.current += part.text;
                                }
                                if (part.inlineData?.data) {
                                    if (!isSpeakingRef.current) {
                                        isSpeakingRef.current = true;
                                        setIsSpeaking(true);
                                    }
                                    audioQueueRef.current.push(part.inlineData.data);
                                    playNextAudio();
                                }
                            }
                        }
                        if (msg.serverContent?.turnComplete) {
                            const check = () => {
                                if (!audioQueueRef.current.length && !isPlayingRef.current) {
                                    setTimeout(() => {
                                        const userText = currentUserTextRef.current.trim();
                                        const aiText = currentAiTextRef.current.trim();
                                        if (userText && aiText && onSaveMessageRef.current) {
                                            onSaveMessageRef.current(userText, aiText);
                                        }
                                        currentUserTextRef.current = '';
                                        currentAiTextRef.current = '';
                                        isSpeakingRef.current = false;
                                        setIsSpeaking(false);
                                        setIsListening(true);
                                        setTranscript('');
                                    }, 300);
                                } else setTimeout(check, 100);
                            };
                            check();
                        }
                    },
                    onclose: () => { isConnectedRef.current = false; },
                    onerror: () => { isConnectedRef.current = false; setStatus('error'); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: { parts: [{ text: sysPrompt }] },
                    tools: [{ googleSearch: {} }],
                    speechConfig: { languageCode: speechLangCode }
                }
            });
            sessionRef.current = session;


            let voiceCounter = 0;
            processorRef.current.onaudioprocess = (e) => {
                if (isPaused) return;
                const data = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
                const rms = Math.sqrt(sum / data.length);
                
                if (isSpeakingRef.current && rms > 0.015) {
                    voiceCounter++;
                    if (voiceCounter >= 2) { interruptAISpeech(); voiceCounter = 0; }
                } else voiceCounter = 0;
                
                setAudioLevel(Math.min(1, rms * 4));
                
                if (sessionRef.current && isConnectedRef.current) {
                    const pcm = new Int16Array(data.length);
                    for (let i = 0; i < data.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
                    const u8 = new Uint8Array(pcm.buffer);
                    let bin = '';
                    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
                    try { sessionRef.current.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: btoa(bin) } }); } catch {}
                }
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);
        } catch { setStatus('error'); }
    };

    const stopSession = useCallback(() => {
        isConnectedRef.current = false;
        isSpeakingRef.current = false;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        
        try { currentSourceRef.current?.stop(); } catch {}
        processorRef.current?.disconnect();
        inputSourceRef.current?.disconnect();
        audioStreamRef.current?.getTracks().forEach(t => t.stop());
        videoStreamRef.current?.getTracks().forEach(t => t.stop());
        if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close().catch(() => {});
        if (playbackContextRef.current?.state !== 'closed') playbackContextRef.current?.close().catch(() => {});
        try { sessionRef.current?.close(); } catch {}
        if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
        
        setStatus('idle');
        setIsSpeaking(false);
        setVideoMode('none');
        setAudioLevel(0);
        setTranscript('');
        setIsPaused(false);
    }, []);


    // Start camera
    const startCamera = useCallback(async (facing: 'environment' | 'user') => {
        // Stop existing video
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            videoStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.playsInline = true;
                await videoRef.current.play();
            }
            
            setVideoMode('camera');
            setFacingMode(facing);

            // Send frames to AI
            if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
            const canvas = canvasRef.current;
            
            const sendFrame = () => {
                if (!videoStreamRef.current || !sessionRef.current || !videoRef.current) return;
                const video = videoRef.current;
                const scale = Math.min(1, 1024 / video.videoWidth);
                canvas.width = video.videoWidth * scale;
                canvas.height = video.videoHeight * scale;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    if (facing === 'user') {
                        ctx.translate(canvas.width, 0);
                        ctx.scale(-1, 1);
                    }
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    try { 
                        sessionRef.current.sendRealtimeInput({ 
                            media: { mimeType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.7).split(',')[1] } 
                        }); 
                    } catch {}
                }
            };
            
            setTimeout(sendFrame, 500);
            sendIntervalRef.current = setInterval(sendFrame, 1500);
            
        } catch (err) {
            console.error('Camera error:', err);
            setVideoMode('none');
        }
    }, []);


    // Start screen share
    const startScreenShare = useCallback(async () => {
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1 } });
            videoStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            
            setVideoMode('screen');

            if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
            const canvas = canvasRef.current;
            
            const sendFrame = () => {
                if (!videoStreamRef.current || !sessionRef.current || !videoRef.current) return;
                const video = videoRef.current;
                const scale = Math.min(1, 1024 / video.videoWidth);
                canvas.width = video.videoWidth * scale;
                canvas.height = video.videoHeight * scale;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                try { 
                    sessionRef.current.sendRealtimeInput({ 
                        media: { mimeType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.7).split(',')[1] } 
                    }); 
                } catch {}
            };
            
            setTimeout(sendFrame, 500);
            sendIntervalRef.current = setInterval(sendFrame, 2000);
            
            stream.getVideoTracks()[0].onended = () => {
                if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
                setVideoMode('none');
            };
            
        } catch (err) {
            console.error('Screen share error:', err);
            setVideoMode('none');
        }
    }, []);

    // Stop video
    const stopVideo = useCallback(() => {
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(t => t.stop());
            videoStreamRef.current = null;
        }
        if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
        if (videoRef.current) videoRef.current.srcObject = null;
        setVideoMode('none');
    }, []);


    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (videoMode === 'camera') {
            stopVideo();
        } else {
            startCamera(facingMode);
        }
    }, [videoMode, facingMode, startCamera, stopVideo]);

    // Switch camera facing
    const switchCamera = useCallback(() => {
        const newFacing = facingMode === 'environment' ? 'user' : 'environment';
        startCamera(newFacing);
    }, [facingMode, startCamera]);

    // Toggle screen share
    const toggleScreen = useCallback(() => {
        if (videoMode === 'screen') {
            stopVideo();
        } else {
            startScreenShare();
        }
    }, [videoMode, startScreenShare, stopVideo]);

    // Toggle pause
    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            const newPaused = !prev;
            if (audioStreamRef.current) {
                audioStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newPaused; });
            }
            if (newPaused) {
                interruptAISpeech();
            }
            return newPaused;
        });
    }, [interruptAISpeech]);

    if (!isOpen) return null;

    const statusText = status === 'connecting' ? (isRu ? 'Подключение...' : 'Connecting...') 
        : status === 'error' ? (isRu ? 'Ошибка' : 'Error')
        : isPaused ? (isRu ? 'Пауза' : 'Paused')
        : isSpeaking ? (isRu ? 'Говорю...' : 'Speaking...')
        : (isRu ? 'Слушаю...' : 'Listening...');


    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
            {/* Video preview - full screen */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${videoMode === 'camera' && facingMode === 'user' ? 'scale-x-[-1]' : ''} ${videoMode === 'none' ? 'hidden' : ''}`}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-center pt-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
                <div className="flex items-center gap-2 text-white">
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                    </div>
                    <span className="text-sm font-medium">Live</span>
                </div>
                
                {/* Switch camera button (only when camera is active) */}
                {videoMode === 'camera' && (
                    <button
                        onClick={switchCamera}
                        className="absolute right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
                    >
                        <RotateCcw size={20} />
                    </button>
                )}
            </div>

            {/* Transcript overlay */}
            {transcript && (
                <div className="absolute top-20 left-0 right-0 px-6 z-10">
                    <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-lg mx-auto">
                        <p className="text-white text-center text-sm leading-relaxed">{transcript}</p>
                    </div>
                </div>
            )}

            {/* Center content when no video */}
            {videoMode === 'none' && (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-white/60 text-sm">{statusText}</p>
                </div>
            )}

            {/* Wave animation at bottom */}
            <WaveAnimation isActive={status === 'connected' && !isPaused} audioLevel={audioLevel} />


            {/* Bottom controls - Gemini style */}
            <div 
                className="relative z-10 pb-8 px-6"
                style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-center justify-center gap-4">
                    {/* Camera button */}
                    <button
                        onClick={toggleCamera}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            videoMode === 'camera' 
                                ? 'bg-white text-black' 
                                : 'bg-[#1a1a1a] border border-zinc-700 text-white'
                        }`}
                    >
                        <Camera size={22} />
                    </button>

                    {/* Screen share button (desktop only) */}
                    {!isMobile && (
                        <button
                            onClick={toggleScreen}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                videoMode === 'screen' 
                                    ? 'bg-white text-black' 
                                    : 'bg-[#1a1a1a] border border-zinc-700 text-white'
                            }`}
                        >
                            <Monitor size={22} />
                        </button>
                    )}

                    {/* Pause/Play button */}
                    <button
                        onClick={togglePause}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isPaused 
                                ? 'bg-[#1a1a1a] border border-zinc-700 text-white' 
                                : 'bg-[#1a1a1a] border border-zinc-700 text-white'
                        }`}
                    >
                        {isPaused ? <Play size={22} /> : <Pause size={22} />}
                    </button>

                    {/* Close button */}
                    <button
                        onClick={() => { stopSession(); onClose(); }}
                        className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};
