import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Trash2,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Square,
} from 'lucide-react';
import { assistantApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Student360Assistant() {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState({
    provider: 'institutional_fallback',
    provider_label: 'Student360 Knowledge Engine (Offline Mode)',
  });

  // Voice Recognition (STT) State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useRef(null);

  // Text to Speech (TTS) State
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Speech APIs and provider status
  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access denied. Please check browser permissions.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please speak clearly into your mic.');
        } else {
          setSpeechError(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    // Check TTS voices
    if (ttsSupported) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          // Pick a good default English voice
          const englishVoice =
            voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google')) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
          setSelectedVoice(englishVoice);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // Fetch Assistant Status
    assistantApi
      .getStatus()
      .then((status) => {
        if (status) {
          setProviderInfo({
            provider: status.provider,
            provider_label: status.provider_label,
          });
        }
      })
      .catch((e) => {
        console.warn('Could not load assistant provider status', e);
      });
  }, []);

  // Seed default welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialGreeting = getInitialGreeting(user, role);
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          context: ['institutional_overview'],
        },
      ]);
    }
  }, [isOpen, user, role]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Stop TTS on unmount or close
  useEffect(() => {
    return () => {
      if (ttsSupported && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getInitialGreeting = (u, r) => {
    if (r === 'student') {
      return `Welcome, **${u?.name || 'Student'}**! I am your **Student360 Academic Assistant**. You can ask me about your daily class timetable, attendance percentage, marks & CGPA, coursework deliverables, tuition fee ledger in ₹, or your retention risk factors.`;
    }
    if (r === 'faculty') {
      return `Hello, **${u?.name || 'Dr. Faculty'}**! I am your **Faculty Advisor Assistant**. I can summarize your teaching schedule, triage assigned students with high retention risk, or review assignment submissions for your class sections.`;
    }
    if (r === 'admin') {
      return `Greetings, **${u?.name || 'Administrator'}**! I am your **Directorate Intelligence Assistant**. I can answer inquiries regarding cohort-wide analytics, full 4,424 dataset provenance, and scoring methodologies.`;
    }
    return `Hello! I am your **Student360 Institutional Assistant**. Sign in to access your authorized academic records.`;
  };

  const getQuickPrompts = () => {
    if (role === 'student') {
      return [
        'What classes do I have today?',
        'What is my attendance percentage?',
        'Explain my GPA and CGPA',
        'Explain my retention risk score',
        'Review my tuition fee status',
      ];
    }
    if (role === 'faculty') {
      return [
        'Show my teaching schedule',
        'Which assigned students have high risk?',
        'Check coursework assignments',
        'Summarize CS-Sem2 attendance',
      ];
    }
    if (role === 'admin') {
      return [
        'Explain cohort risk distribution',
        'Show dataset provenance stats',
        'Summarize institutional fee collections',
        'How is Student Success Score calculated?',
      ];
    }
    return ['What can you help me with?'];
  };

  const speakText = (text) => {
    if (!ttsSupported) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Strip markdown formatting for cleaner speech synthesis
    const cleanSpeech = text
      .replace(/[*#_`~\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (ttsSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setSpeechError(null);
    setLoading(true);

    try {
      // Build conversation history window
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await assistantApi.chat({
        message: text,
        conversation_history: history,
        context_student_id: role === 'student' ? user?.id : null,
      });

      const assistantMsg = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        context: res.authorized_context_used || [],
        provider_label: res.provider_label,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If user has TTS enabled, speak response aloud
      if (ttsEnabled) {
        speakText(res.reply);
      }
    } catch (err) {
      const errText =
        err.response?.data?.detail ||
        err.message ||
        'Unable to contact Student360 Assistant service.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Request Error**: ${errText}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleMic = () => {
    if (!speechSupported) {
      setSpeechError('Web Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setSpeechError(null);
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Speech recognition start failed', e);
      }
    }
  };

  const handleClearHistory = () => {
    stopSpeaking();
    setMessages([]);
    const initialGreeting = getInitialGreeting(user, role);
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        context: ['institutional_overview'],
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // If not authenticated, don't show floating button
  if (!user) return null;

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-[#00338D] hover:bg-[#00266B] text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 group border-2 border-white focus:outline-none focus:ring-4 focus:ring-blue-300"
          title="Open Student360 AI Assistant"
          aria-label="Open Student360 AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-white" />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline-block">
            Student360 AI Assistant
          </span>
        </button>
      )}

      {/* Main Assistant Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-white border border-[#D0D0D0] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'w-[95vw] sm:w-[720px] h-[88vh] max-h-[820px]'
              : 'w-[95vw] sm:w-[430px] h-[78vh] max-h-[640px]'
          }`}
          style={{ minHeight: '480px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#00338D] text-white flex items-center justify-between border-b border-[#00266B] flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold truncate">Student360 AI Assistant</h3>
                  <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono uppercase tracking-wider font-semibold">
                    {role}
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 truncate">
                  {user?.name} &bull; {user?.id}
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              {/* TTS Audio Mute/Unmute toggle */}
              {ttsSupported && (
                <button
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setTtsEnabled(!ttsEnabled);
                  }}
                  className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                    ttsEnabled ? 'text-emerald-300 font-bold' : 'text-blue-200 hover:text-white'
                  }`}
                  title={ttsEnabled ? 'Voice Responses: Enabled (Click to Mute)' : 'Voice Responses: Muted (Click to Enable)'}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}

              {/* Stop Speaking button if audio is currently playing */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1 animate-pulse"
                  title="Stop voice playback"
                >
                  <Square className="w-2.5 h-2.5 fill-current" /> Stop Audio
                </button>
              )}

              {/* Expand / Minimize Window */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-blue-100 hover:text-white rounded hover:bg-white/10 transition-colors hidden sm:block"
                title={isExpanded ? 'Compact View' : 'Expand View'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Clear conversation */}
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-blue-100 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Close panel */}
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 text-blue-100 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Provider & Role Banner */}
          <div className="px-4 py-1.5 bg-[#F5F5F5] border-b border-[#D0D0D0] flex items-center justify-between text-[11px] text-[#4A4A4A] flex-shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1A7F37] flex-shrink-0" />
              <span className="truncate">
                Mode: <strong className="text-[#1A1A1A]">{providerInfo.provider_label}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10.5px] text-[#767676] flex-shrink-0">
              <span>RBAC Boundary:</span>
              <strong className="text-[#1A1A1A] uppercase">{role}</strong>
            </div>
          </div>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-md bg-[#00338D] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#00338D] text-white rounded-br-none shadow-sm'
                        : msg.isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-bl-none'
                        : 'bg-[#F5F5F5] border border-[#D0D0D0] text-[#1A1A1A] rounded-bl-none shadow-sm'
                    }`}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-line prose-xs font-normal">
                      {msg.text}
                    </div>

                    {/* Metadata & Actions */}
                    <div
                      className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] gap-2 ${
                        isUser
                          ? 'border-blue-400/40 text-blue-100'
                          : 'border-[#E0E0E0] text-[#767676]'
                      }`}
                    >
                      <span>{msg.timestamp}</span>

                      {/* Read aloud speaker button on assistant message */}
                      {!isUser && ttsSupported && (
                        <div className="flex items-center gap-2">
                          {msg.context && msg.context.length > 0 && (
                            <span className="font-mono text-[9px] uppercase tracking-wider text-[#00338D] bg-white px-1.5 py-0.2 rounded border border-[#D0D0D0]">
                              Context: {msg.context.slice(0, 2).join(', ')}
                            </span>
                          )}
                          <button
                            onClick={() => speakText(msg.text)}
                            className="p-1 hover:text-[#00338D] rounded hover:bg-slate-200 transition-colors flex items-center gap-1"
                            title="Read this response aloud"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-md bg-[#1A1A1A] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-md bg-[#00338D] text-white flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#F5F5F5] border border-[#D0D0D0] rounded-lg p-2.5 text-xs text-[#4A4A4A] flex items-center gap-2 shadow-sm">
                  <span>Assistant is analyzing verified records...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions Chips */}
          <div className="px-3 py-2 bg-[#FAFAFA] border-t border-[#E0E0E0] overflow-x-auto flex-shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10.5px] font-bold text-[#767676] flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-[#00338D]" /> Suggestions:
              </span>
              {getQuickPrompts().map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-[#EBF3FC] text-[#00338D] border border-[#D0D0D0] hover:border-[#00338D] rounded-full transition-all shadow-2xs disabled:opacity-50 flex-shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Listening Active Banner */}
          {isListening && (
            <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-pulse flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span className="font-semibold">Microphone active: Listening... Speak your question</span>
              </div>
              <button
                onClick={toggleMic}
                className="text-[11px] font-bold underline hover:text-rose-950"
              >
                Stop listening
              </button>
            </div>
          )}

          {/* Voice Error Banner */}
          {speechError && (
            <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span>{speechError}</span>
              </div>
              <button
                onClick={() => setSpeechError(null)}
                className="text-amber-700 hover:text-amber-900 font-bold ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {/* Input & Voice Controls Bar */}
          <div className="p-3 bg-white border-t border-[#D0D0D0] flex-shrink-0">
            <div className="flex items-end gap-2 bg-[#F5F5F5] border border-[#D0D0D0] rounded-lg p-1.5 focus-within:border-[#00338D] focus-within:bg-white transition-all">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? 'Listening... speak clearly into your microphone'
                    : 'Ask about classes, marks, attendance, fees, risk factors... (Enter to send)'
                }
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent border-0 resize-none text-xs text-[#1A1A1A] placeholder-[#767676] focus:outline-none p-1.5 max-h-24 min-h-[36px]"
              />

              {/* Microphone Speech Recognition Button */}
              {speechSupported ? (
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2 rounded-md transition-all flex-shrink-0 ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-md animate-pulse'
                      : 'text-[#4A4A4A] hover:text-[#00338D] hover:bg-slate-200'
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak via microphone (Web Speech API)'}
                  aria-label={isListening ? 'Stop listening' : 'Start microphone input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              ) : (
                <div
                  className="p-2 text-slate-300 cursor-not-allowed"
                  title="Speech recognition not supported in this browser"
                >
                  <Mic className="w-4 h-4" />
                </div>
              )}

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="p-2 bg-[#00338D] hover:bg-[#00266B] text-white rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                title="Send Message"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Footer Status Notes */}
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#767676]">
              <span>Press Enter to submit &bull; Shift+Enter for new line</span>
              <span className="font-medium text-[#00338D]">
                Student360 Institutional AI
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
