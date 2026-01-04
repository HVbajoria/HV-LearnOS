import React, { useState, useRef, useEffect } from 'react';
import { generateChatResponse } from '../services/geminiService';
import { Icons } from '../constants';
import { ChatMessage } from '../types';

interface ChatWidgetProps {
  contextTopic: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ contextTopic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi! I'm here to help you learn about ${contextTopic}. Ask me anything!`, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const responseText = await generateChatResponse(history, input);
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Sorry, I had trouble connecting. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: 'model', text: "Voice not supported in this browser.", timestamp: Date.now() }]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setLiveTranscript(prev => (final || interim));
      // show interim in input while recording
      setInput(final || interim);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e);
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setLiveTranscript('');
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[500px] bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
          <div className="p-4 bg-zinc-950 flex flex-col gap-2 border-b border-zinc-900">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-amber-400"><Icons.Brain /></span>
                AI Tutor
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
            {/* Top status banner */}
            {loading && (
              <div className="text-sm bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md px-3 py-2 flex items-center gap-2">
                <div className="text-amber-400 font-medium">🤔 Trying to understand your requirement</div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {isRecording && (
              <div className="text-sm bg-red-900/20 border border-red-800/30 text-red-300 rounded-md px-3 py-2 flex items-center gap-2">
                <div className="text-red-400 font-medium">🎤 Listening to your voice</div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-amber-400 text-black' 
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                }`}>
                  {/* Rudimentary Markdown rendering */}
                  {msg.text.split('\n').map((line, i) => (
                     <React.Fragment key={i}>
                       {line.startsWith('- ') ? <div className="ml-2">• {line.substring(2)}</div> : <div>{line}</div>}
                     </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-zinc-300 text-sm flex items-center gap-3">
                  <div className="typing-dots flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                  <span className="text-zinc-400">AI is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-zinc-950 border-t border-zinc-900">
            <div className="flex flex-col gap-2">
              {/* Live transcript shown while recording */}
              {isRecording && (
                <div className="text-xs text-zinc-300 bg-red-900/20 border border-red-800/30 rounded-md px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 animate-pulse"><Icons.Mic /></span>
                    <div className="text-red-200 font-medium">🎤 Listening...</div>
                    {liveTranscript && (
                      <div className="text-zinc-300 italic bg-zinc-800 px-2 py-1 rounded text-xs max-w-32 truncate">
                        "{liveTranscript}"
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={stopRecording} className="text-red-300 hover:text-red-100 bg-red-800/30 hover:bg-red-700/40 rounded px-2 py-1 transition-colors">
                    <Icons.Stop className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => (isRecording ? stopRecording() : startRecording())}
                  className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/25' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-amber-400'}`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <Icons.Stop /> : <Icons.Mic />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question... (or press the mic)"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-amber-400 hover:bg-amber-500 text-black rounded-xl px-4 py-2 disabled:opacity-50 transition-colors"
                >
                  <Icons.ArrowRight />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-amber-400 hover:bg-amber-500 text-black rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto"
      >
        {isOpen ? <span className="text-xl">✕</span> : <Icons.MessageCircle />}
      </button>
    </div>
  );
};