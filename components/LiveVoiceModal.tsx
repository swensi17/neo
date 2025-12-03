import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mic, MicOff, Monitor, MonitorOff, Camera, CameraOff } from 'lucide-react';
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

// Perplexity-style particle sphere - smooth cyan dots that breathe with voice
const ParticleSphere = ({ 
    audioLevel,
    isActive
}: { 
    audioLevel: number;
    isActive: boolean;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<Array<{baseX: number; baseY: number; baseZ: number; offset: number}>>([]);
    const timeRef = useRef(0);
    const audioLevelRef = useRef(0);
    const targetAudioRef = useRef(0);
    const isActiveRef = useRef(false);
    
    // Update refs when props change (no re-render of animation)
    useEffect(() => {
        targetAudioRef.current = audioLevel;
        isActiveRef.current = isActive;
    }, [audioLevel, isActive]);
    
    // Initialize particles once
    useEffect(() => {
        const particles: typeof particlesRef.current = [];
        const numParticles = 600; // Slightly fewer for performance
        
        for (let i = 0; i < numParticles; i++) {
            // Fibonacci sphere for even distribution
            const phi = Math.acos(1 - 2 * (i + 0.5) / numParticles);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            const radius = 90;
            particles.push({
                baseX: radius * Math.sin(phi) * Math.cos(theta),
                baseY: radius * Math.sin(phi) * Math.sin(theta),
                baseZ: radius * Math.cos(phi),
                offset: Math.random() * Math.PI * 2 // Random phase for organic feel
            });
        }
        particlesRef.current = particles;
    }, []);
    
    // Single animation loop - never recreated
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const size = 280;
        canvas.width = size * 2; // Higher res
        canvas.height = size * 2;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        ctx.scale(2, 2);
        
        const centerX = size / 2;
        const centerY = size / 2;
        
        const animate = () => {
            timeRef.current += 0.008; // Slower, smoother rotation
            
            // Smooth interpolation of audio level (key for smoothness!)
            audioLevelRef.current += (targetAudioRef.current - audioLevelRef.current) * 0.15;
            const smoothAudio = audioLevelRef.current;
            const active = isActiveRef.current;
            
            ctx.clearRect(0, 0, size, size);
            
            const particles = particlesRef.current;
            const cosR = Math.cos(timeRef.current);
            const sinR = Math.sin(timeRef.current);
            
            // Pre-calculate and sort by depth
            const projected: Array<{x: number; y: number; z: number; size: number}> = [];
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Rotate around Y axis
                const x = p.baseX * cosR - p.baseZ * sinR;
                const z = p.baseX * sinR + p.baseZ * cosR;
                const y = p.baseY;
                
                // Breathing effect - particles move outward based on audio
                // Only radial expansion, keeps sphere shape
                const breathe = active ? 1 + smoothAudio * 0.25 : 1;
                const pulse = Math.sin(timeRef.current * 3 + p.offset) * (active ? smoothAudio * 8 : 2);
                
                const finalX = x * breathe + (x / 90) * pulse;
                const finalY = y * breathe + (y / 90) * pulse;
                const finalZ = z * breathe;
                
                // 3D to 2D projection
                const perspective = 350;
                const scale = perspective / (perspective + finalZ);
                
                projected.push({
                    x: centerX + finalX * scale,
                    y: centerY + finalY * scale,
                    z: finalZ,
                    size: Math.max(1.2, 2.2 * scale)
                });
            }
            
            // Sort by z (back to front)
            projected.sort((a, b) => a.z - b.z);
            
            // Draw particles
            for (let i = 0; i < projected.length; i++) {
                const p = projected[i];
                const depthOpacity = 0.25 + 0.75 * ((p.z + 90) / 180);
                const alpha = depthOpacity * (active ? 0.9 : 0.4);
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
                ctx.fill();
            }
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => cancelAnimationFrame(animationRef.current);
    }, []); // Empty deps - animation runs once
    
    return (
        <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
            {/* Glow effect */}
            <div 
                className="absolute rounded-full transition-all duration-500"
                style={{
                    width: 280,
                    height: 280,
                    background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
                    opacity: isActive ? 1 : 0.3
                }}
            />
            <canvas 
                ref={canvasRef} 
                className="relative"
                style={{ width: 300, height: 300 }}
            />
        </div>
    );
};


export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ 
    isOpen, onClose, systemInstruction, userName, userBio, adultMode, language = 'ru', modelLanguage = 'ru', isLight = false, onSaveMessage, responseLength = 'balanced', incognito = false
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
    const currentUserTextRef = useRef<string>('');
    const currentAiTextRef = useRef<string>('');
    const onSaveMessageRef = useRef(onSaveMessage);
    
    // Keep ref updated
    useEffect(() => {
        onSaveMessageRef.current = onSaveMessage;
    }, [onSaveMessage]);

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
            setTranscript('');
            setAudioLevel(0);
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
            
            const isRuPrompt = language === 'ru';
            let sysPrompt = systemInstruction || (isRuPrompt ? 'Ты голосовой помощник NEO.' : 'You are NEO voice assistant.');
            sysPrompt += isRuPrompt 
                ? ` ВАЖНО: Отвечай ТОЛЬКО на языке: ${langName}. Это обязательно.`
                : ` IMPORTANT: Respond ONLY in ${langName}. This is mandatory.`;
            if (userName) sysPrompt += isRuPrompt ? ` Пользователя зовут ${userName}.` : ` User's name is ${userName}.`;
            if (userBio) sysPrompt += isRuPrompt ? ` О нём: ${userBio}` : ` About them: ${userBio}`;
            if (adultMode) sysPrompt += isRuPrompt ? ' Режим без ограничений включён, отвечай без цензуры.' : ' Unrestricted mode enabled, respond without censorship.';
            
            // Response length instruction
            if (responseLength === 'brief') {
                sysPrompt += isRuPrompt ? ' Отвечай ОЧЕНЬ кратко, 1-2 предложения максимум.' : ' Be VERY brief, 1-2 sentences max.';
            } else if (responseLength === 'detailed') {
                sysPrompt += isRuPrompt ? ' Отвечай подробно с примерами и объяснениями.' : ' Be detailed with examples and explanations.';
            } else {
                sysPrompt += isRuPrompt ? ' Отвечай сбалансированно, не слишком коротко и не слишком длинно.' : ' Be balanced, not too short and not too long.';
            }


            // Language code mapping for speech config
            const SPEECH_LANG_CODES: Record<string, string> = {
                'ru': 'ru-RU', 'en': 'en-US', 'uk': 'uk-UA', 'de': 'de-DE',
                'fr': 'fr-FR', 'es': 'es-ES', 'it': 'it-IT', 'pt': 'pt-PT',
                'zh': 'cmn-CN', 'ja': 'ja-JP', 'ko': 'ko-KR', 'ar': 'ar-XA', 'tr': 'tr-TR'
            };
            const speechLangCode = SPEECH_LANG_CODES[modelLanguage] || 'ru-RU';

            // Play connection sound
            const playConnectSound = () => {
                try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    // Pleasant two-tone chime
                    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                    oscillator.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.1); // C#6
                    
                    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.3);
                } catch {}
            };

            const session = await ai.live.connect({
                model: 'gemini-2.0-flash-live-001',
                callbacks: {
                    onopen: () => { 
                        setStatus('connected'); 
                        isConnectedRef.current = true;
                        playConnectSound();
                        
                        // Send greeting prompt after short delay
                        setTimeout(() => {
                            if (sessionRef.current && isConnectedRef.current) {
                                const greeting = isRuPrompt 
                                    ? 'Поприветствуй пользователя коротко и скажи что готов помочь.'
                                    : 'Greet the user briefly and say you are ready to help.';
                                sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text: greeting }] }] });
                            }
                        }, 500);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle user input transcription
                        const inputTranscript = (msg as any).serverContent?.inputTranscript;
                        if (inputTranscript) {
                            currentUserTextRef.current += inputTranscript + ' ';
                        }
                        
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
                                        // Keep microphone ON so user can interrupt!
                                        // Just change visual state, don't disable audio track
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
                                        // Save conversation to chat
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
                    speechConfig: {
                        languageCode: speechLangCode
                    }
                }
            });
            sessionRef.current = session;

            // Fast voice detection - interrupt AI immediately when user speaks
            let voiceCounter = 0;
            const INTERRUPT_THRESHOLD = 2; // Very fast interrupt - 2 frames (~50ms)
            const VOICE_THRESHOLD = 0.015; // Lower threshold for better sensitivity
            
            processorRef.current.onaudioprocess = (e) => {
                const data = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
                const rms = Math.sqrt(sum / data.length);
                
                // Smooth audio level for visualization
                const smoothedLevel = rms * 4;
                
                // Instant interrupt when user starts speaking while AI is talking
                if (isSpeakingRef.current && rms > VOICE_THRESHOLD) {
                    voiceCounter++;
                    if (voiceCounter >= INTERRUPT_THRESHOLD) { 
                        interruptAISpeech(); 
                        voiceCounter = 0; 
                    }
                } else if (rms <= VOICE_THRESHOLD) {
                    voiceCounter = 0; // Reset immediately when quiet
                }
                
                // Update audio level for visualization (both when listening and speaking)
                setAudioLevel(Math.min(1, smoothedLevel));
                
                // Always send audio to server (server handles VAD - voice activity detection)
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

    // Mute button - just mutes mic, AI continues speaking
    const toggleMute = () => {
        if (streamRef.current) {
            const newMuted = isListening; // if listening, mute it
            streamRef.current.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
            setIsListening(!newMuted);
        }
    };
    
    // Interrupt AI when user wants to speak
    const handleInterrupt = () => {
        if (isSpeakingRef.current) {
            interruptAISpeech();
        }
    };

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const toggleScreen = async () => {
        if (isScreenSharing) {
            if (screenIntervalRef.current) clearInterval(screenIntervalRef.current);
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            setIsScreenSharing(false);
        } else {
            try {
                let stream: MediaStream;
                
                // On mobile, use camera instead of screen share
                if (isMobile) {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
                    });
                } else {
                    // On desktop, use screen share
                    stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1 } });
                }
                
                screenStreamRef.current = stream;
                setIsScreenSharing(true);
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.muted = true;
                video.playsInline = true;
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
                // Send more frequently on mobile (camera) for better responsiveness
                screenIntervalRef.current = setInterval(send, isMobile ? 1500 : 2000);
                stream.getVideoTracks()[0].onended = () => {
                    if (screenIntervalRef.current) clearInterval(screenIntervalRef.current);
                    setIsScreenSharing(false);
                };
            } catch (err) {
                console.error('Screen/camera share error:', err);
            }
        }
    };

    if (!isOpen) return null;

    // Perplexity-style status text
    const statusText = status === 'connecting' ? (isRu ? 'Подключение...' : 'Connecting...') 
        : status === 'error' ? (isRu ? 'Ошибка' : 'Error')
        : isSpeaking ? (isRu ? 'Говорю...' : 'Speaking...')
        : !isListening ? (isRu ? 'Микрофон выключен' : 'Microphone off')
        : (isRu ? 'Скажите что-нибудь...' : 'Say something...');


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
            
            {/* Center - Particle Sphere */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <ParticleSphere 
                    audioLevel={audioLevel}
                    isActive={status === 'connected' && (isListening || isSpeaking)}
                />
                
                <p className={`mt-6 text-sm tracking-wide ${isLight ? 'text-cyan-600' : 'text-cyan-400/70'}`}>
                    {statusText}
                </p>
                
                {isScreenSharing && (
                    <p className={`mt-2 text-xs ${isLight ? 'text-green-600' : 'text-green-400'} flex items-center gap-1`}>
                        {isMobile ? <Camera size={12} /> : <Monitor size={12} />}
                        {isMobile 
                            ? (isRu ? 'Камера видна ИИ' : 'Camera visible to AI')
                            : (isRu ? 'Экран виден ИИ' : 'Screen visible to AI')
                        }
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
                        onClick={toggleMute}
                        className={`rounded-full flex items-center justify-center transition-all ${
                            isListening
                                ? 'bg-[#1a1a1a] border-2 border-cyan-500/50 text-cyan-400'
                                : 'bg-[#1a1a1a] border-2 border-zinc-700 text-zinc-500'
                        }`}
                        style={{ width: 64, height: 64 }}
                        title={isListening ? (isRu ? 'Выключить микрофон' : 'Mute') : (isRu ? 'Включить микрофон' : 'Unmute')}
                    >
                        {isListening ? <Mic size={28} /> : <MicOff size={28} />}
                    </button>

                    <button 
                        onClick={toggleScreen}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isScreenSharing ? 'bg-green-500 text-white shadow-lg shadow-green-500/40' 
                            : `${btnBg} border ${textMuted}`
                        }`}
                        title={isMobile ? (isRu ? 'Камера' : 'Camera') : (isRu ? 'Экран' : 'Screen')}
                    >
                        {/* Show camera icon on mobile, monitor on desktop */}
                        {isMobile 
                            ? (isScreenSharing ? <Camera size={22} /> : <CameraOff size={22} />)
                            : (isScreenSharing ? <Monitor size={22} /> : <MonitorOff size={22} />)
                        }
                    </button>
                </div>


            </div>
        </div>
    );
};
