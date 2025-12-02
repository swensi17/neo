import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mic, MicOff, Monitor, MonitorOff } from 'lucide-react';
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
}

// Minimalist animated orb - CSS based, no canvas
const AnimatedOrb = ({ 
    isListening, 
    isSpeaking, 
    audioLevel,
    isLight
}: { 
    isListening: boolean; 
    isSpeaking: boolean; 
    audioLevel: number;
    isLight: boolean;
}) => {
    const scale = 1 + audioLevel * 0.15;
    const isActive = isListening || isSpeaking;
    
    // Colors based on state
    const getColors = () => {
        if (isSpeaking) {
            return isLight 
                ? { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(59,130,246,0.4)' }
                : { primary: '#60a5fa', secondary: '#93c5fd', glow: 'rgba(96,165,250,0.3)' };
        }
        if (isListening) {
            return isLight
                ? { primary: '#dc2626', secondary: '#f87171', glow: 'rgba(220,38,38,0.4)' }
                : { primary: '#f87171', secondary: '#fca5a5', glow: 'rgba(248,113,113,0.3)' };
        }
        return isLight
            ? { primary: '#6b7280', secondary: '#9ca3af', glow: 'rgba(107,114,128,0.2)' }
            : { primary: '#9ca3af', secondary: '#d1d5db', glow: 'rgba(156,163,175,0.2)' };
    };
    
    const colors = getColors();

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer glow rings */}
            <div 
                className="absolute rounded-full transition-all duration-500"
                style={{
                    width: 220,
                    height: 220,
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                    transform: `scale(${isActive ? 1.2 + audioLevel * 0.3 : 1})`,
                    opacity: isActive ? 0.8 : 0.3
                }}
            />
            
            {/* Middle ring */}
            <div 
                className="absolute rounded-full transition-all duration-300"
                style={{
                    width: 180,
                    height: 180,
                    border: `2px solid ${colors.secondary}`,
                    opacity: isActive ? 0.5 + audioLevel * 0.3 : 0.2,
                    transform: `scale(${scale})`
                }}
            />
            
            {/* Main orb */}
            <div 
                className="relative rounded-full transition-all duration-200"
                style={{
                    width: 140,
                    height: 140,
                    background: `radial-gradient(circle at 30% 30%, ${colors.secondary}, ${colors.primary})`,
                    boxShadow: `
                        0 0 60px ${colors.glow},
                        inset 0 0 40px rgba(255,255,255,0.1)
                    `,
                    transform: `scale(${scale})`
                }}
            >
                {/* Inner highlight */}
                <div 
                    className="absolute rounded-full"
                    style={{
                        top: '15%',
                        left: '20%',
                        width: '30%',
                        height: '30%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
                    }}
                />
            </div>
            
            {/* Pulse animation when active */}
            {isActive && (
                <div 
                    className="absolute rounded-full animate-ping"
                    style={{
                        width: 140,
                        height: 140,
                        border: `2px solid ${colors.primary}`,
                        opacity: 0.3,
                        animationDuration: '2s'
                    }}
                />
            )}
        </div>
    );
};


export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ 
    isOpen, onClose, systemInstruction, userName, userBio, adultMode, language = 'ru', modelLanguage = 'ru', isLight = false
}) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [isListening, setIsListening] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const sessionRef = useRef<any>(null);
    const isConnectedRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const audioQueueRef = useRef<string[]>([]);
    const isPlayingRef = useRef(false);
    const screenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const isRu = language === 'ru';
    const bgColor = isLight ? 'bg-white' : 'bg-black';
    const textColor = isLight ? 'text-gray-900' : 'text-white';
    const textMuted = isLight ? 'text-gray-400' : 'text-white/40';
    const btnBg = isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800';

    useEffect(() => {
        if (isOpen) startSession();
        else stopSession();
        return () => stopSession();
    }, [isOpen]);

    const interruptAISpeech = useCallback(() => {
        if (isSpeakingRef.current) {
            if (currentSourceRef.current) { try { currentSourceRef.current.stop(); } catch {} }
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            setIsListening(true);
            streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true; });
        }
    }, []);


    const playNextAudio = useCallback(async () => {
        if (isPlayingRef.current || !audioQueueRef.current.length) return;
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
                        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true; });
                    }
                }, 300);
            };
            source.start();
        } catch (err) {
            isPlayingRef.current = false;
            playNextAudio();
        }
    }, []);

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
            streamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            inputSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            // Language names for voice responses
            const LANG_NAMES: Record<string, string> = {
              'ru': 'русском', 'en': 'English', 'uk': 'українською', 'kk': 'қазақша',
              'uz': "o'zbekcha", 'tg': 'тоҷикӣ', 'ky': 'кыргызча', 'az': 'azərbaycan',
              'hy': 'հայերdelays', 'ka': 'ქართულად', 'be': 'беларускай', 'de': 'Deutsch',
              'fr': 'français', 'es': 'español', 'it': 'italiano', 'zh': '中文',
              'ja': '日本語', 'ko': '한국어', 'ar': 'العربية', 'tr': 'Türkçe'
            };
            const langName = LANG_NAMES[modelLanguage] || modelLanguage;
            
            let sysPrompt = systemInstruction || 'Ты голосовой помощник NEO.';
            sysPrompt += ` ВАЖНО: Отвечай ТОЛЬКО на языке: ${langName}. Это обязательно.`;
            if (userName) sysPrompt += ` Пользователя зовут ${userName}.`;
            if (userBio) sysPrompt += ` О нём: ${userBio}`;
            if (adultMode) sysPrompt += ' Режим без ограничений включён.';


            const session = await ai.live.connect({
                model: 'gemini-2.0-flash-live-001',
                callbacks: {
                    onopen: () => { setStatus('connected'); isConnectedRef.current = true; },
                    onmessage: async (msg: LiveServerMessage) => {
                        const parts = msg.serverContent?.modelTurn?.parts;
                        if (parts) {
                            for (const part of parts) {
                                if (part.text) setTranscript(prev => prev + part.text);
                                if (part.inlineData?.data) {
                                    if (!isSpeakingRef.current) {
                                        isSpeakingRef.current = true;
                                        setIsSpeaking(true);
                                        setIsListening(false);
                                        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
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
                                        isSpeakingRef.current = false;
                                        setIsSpeaking(false);
                                        setIsListening(true);
                                        setTranscript('');
                                        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true; });
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
                }
            });
            sessionRef.current = session;

            let voiceCounter = 0;
            processorRef.current.onaudioprocess = (e) => {
                const data = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
                const rms = Math.sqrt(sum / data.length);
                
                if (isSpeakingRef.current && rms > 0.02) {
                    if (++voiceCounter >= 3) { interruptAISpeech(); voiceCounter = 0; }
                } else voiceCounter = 0;
                
                if (!isSpeakingRef.current) setAudioLevel(Math.min(1, rms * 5));
                
                if (!isSpeakingRef.current && sessionRef.current && isConnectedRef.current) {
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
        streamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close().catch(() => {});
        if (playbackContextRef.current?.state !== 'closed') playbackContextRef.current?.close().catch(() => {});
        try { sessionRef.current?.close(); } catch {}
        if (screenIntervalRef.current) clearInterval(screenIntervalRef.current);
        
        setStatus('idle');
        setIsSpeaking(false);
        setIsScreenSharing(false);
        setAudioLevel(0);
        setTranscript('');
    }, []);

    const toggleMic = () => {
        if (isSpeakingRef.current) interruptAISpeech();
        else if (streamRef.current) {
            const newState = !isListening;
            streamRef.current.getAudioTracks().forEach(t => { t.enabled = newState; });
            setIsListening(newState);
        }
    };

    const toggleScreen = async () => {
        if (isScreenSharing) {
            if (screenIntervalRef.current) clearInterval(screenIntervalRef.current);
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            setIsScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1 } });
                screenStreamRef.current = stream;
                setIsScreenSharing(true);
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.muted = true;
                await video.play();
                
                if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
                const canvas = canvasRef.current;
                
                const send = () => {
                    if (!screenStreamRef.current || !sessionRef.current) return;
                    const scale = Math.min(1, 1024 / video.videoWidth);
                    canvas.width = video.videoWidth * scale;
                    canvas.height = video.videoHeight * scale;
                    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                    try { sessionRef.current.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.7).split(',')[1] } }); } catch {}
                };
                
                setTimeout(send, 500);
                screenIntervalRef.current = setInterval(send, 2000);
                stream.getVideoTracks()[0].onended = () => {
                    if (screenIntervalRef.current) clearInterval(screenIntervalRef.current);
                    setIsScreenSharing(false);
                };
            } catch {}
        }
    };

    if (!isOpen) return null;

    const statusText = status === 'connecting' ? (isRu ? 'Подключение...' : 'Connecting...') 
        : status === 'error' ? (isRu ? 'Ошибка' : 'Error')
        : isSpeaking ? (isRu ? 'Отвечаю...' : 'Speaking...')
        : !isListening ? (isRu ? 'Пауза' : 'Paused')
        : (isRu ? 'Слушаю...' : 'Listening...');


    return (
        <div className={`fixed inset-0 z-[120] ${bgColor} ${textColor} flex flex-col font-sans`}>
            
            {/* Transcript - top */}
            {transcript && (
                <div className="absolute top-0 left-0 right-0 pt-20 px-8 pb-6 text-center z-10">
                    <p className={`text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto ${textColor}`}>
                        {transcript}
                    </p>
                </div>
            )}
            
            {/* Center - Orb */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <AnimatedOrb 
                    isListening={isListening && status === 'connected' && !isSpeaking} 
                    isSpeaking={isSpeaking}
                    audioLevel={audioLevel}
                    isLight={isLight}
                />
                
                <p className={`mt-10 text-sm font-medium tracking-wide ${
                    isSpeaking ? (isLight ? 'text-blue-600' : 'text-blue-400') 
                    : (isListening && status === 'connected') ? (isLight ? 'text-red-600' : 'text-red-400') 
                    : textMuted
                }`}>
                    {statusText}
                </p>
                
                {isScreenSharing && (
                    <p className={`mt-2 text-xs ${isLight ? 'text-green-600' : 'text-green-400'} flex items-center gap-1`}>
                        <Monitor size={12} />
                        {isRu ? 'Экран виден ИИ' : 'Screen visible to AI'}
                    </p>
                )}
            </div>

            {/* Controls - bottom */}
            <div className="pb-12 flex flex-col items-center gap-5">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => { stopSession(); onClose(); }}
                        className={`w-14 h-14 rounded-full ${btnBg} border flex items-center justify-center ${textMuted} transition-all`}
                    >
                        <X size={24} />
                    </button>

                    <button 
                        onClick={toggleMic}
                        className={`w-18 h-18 rounded-full flex items-center justify-center transition-all ${
                            isSpeaking ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                            : isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' 
                            : `${btnBg} border ${textMuted}`
                        }`}
                        style={{ width: 72, height: 72 }}
                    >
                        {isListening || isSpeaking ? <Mic size={32} /> : <MicOff size={32} />}
                    </button>

                    <button 
                        onClick={toggleScreen}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isScreenSharing ? 'bg-green-500 text-white shadow-lg shadow-green-500/40' 
                            : `${btnBg} border ${textMuted}`
                        }`}
                    >
                        {isScreenSharing ? <Monitor size={22} /> : <MonitorOff size={22} />}
                    </button>
                </div>

                <p className={`${textMuted} text-xs`}>
                    {isRu ? 'Говорите — ИИ слушает' : 'Speak — AI listens'}
                </p>
            </div>
        </div>
    );
};
