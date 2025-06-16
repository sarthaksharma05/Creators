import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Send, 
  X, 
  Bot,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Phone,
  PhoneOff
} from 'lucide-react';
import { tavusService } from '../../lib/tavus';
import { elevenLabsService } from '../../lib/elevenlabs';
import { openaiService } from '../../lib/openai';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface AIChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AIChatWidget({ isOpen, onToggle }: AIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your AI assistant. I can help you learn about CreatorCopilot, generate content ideas, or answer any questions you have. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock avatar data - in production this would come from Tavus
  const avatarVideo = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face";

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isVideoCall) {
      inputRef.current.focus();
    }
  }, [isOpen, isVideoCall]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsSpeaking(true);

    try {
      // Generate AI response using OpenAI
      const aiResponse = await generateAIResponse(content);
      
      // Generate voice response using ElevenLabs
      const audioUrl = await elevenLabsService.generateVoice(aiResponse, 'rachel');
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        audioUrl
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-play audio if not muted and simulate speaking animation
      if (!isMuted && audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
        
        // Simulate speaking duration
        setTimeout(() => {
          setIsSpeaking(false);
        }, 3000);
      } else {
        setIsSpeaking(false);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Create a context-aware prompt for the AI
    const systemPrompt = `You are an AI assistant for CreatorCopilot, a comprehensive AI-powered content creation platform. 

CreatorCopilot offers:
- AI Content Generation (scripts, captions, hashtags, ideas)
- Professional Voiceovers with ElevenLabs
- AI Video Creation with Tavus avatars
- TrendRadar for discovering trending topics
- Campaign Marketplace for brand partnerships
- Analytics and insights

You should be helpful, friendly, and knowledgeable about content creation, social media, and the creator economy. Keep responses conversational and under 150 words. If users ask about features, explain how CreatorCopilot can help them.`;

    try {
      // Use OpenAI to generate contextual response
      const response = await openaiService.generateContent(
        'ideas', 
        'general', 
        'general', 
        `System: ${systemPrompt}\n\nUser: ${userMessage}\n\nRespond as the CreatorCopilot AI assistant:`
      );
      
      return response || "I'd be happy to help you with that! CreatorCopilot has many features that can boost your content creation. What specific area would you like to explore?";
    } catch (error) {
      return "I'd be happy to help you with CreatorCopilot! Our platform offers AI content generation, voiceovers, video creation, and trend analysis. What would you like to know more about?";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would typically convert speech to text
        // For demo purposes, we'll simulate this
        await handleSendMessage("I just sent you a voice message!");
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const startVideoCall = async () => {
    setIsVideoCall(true);
    setIsMinimized(false);
    
    // Simulate starting a video call with AI avatar
    const welcomeMessage = "Hello! I'm your AI assistant. I can see and hear you now. How can I help you today?";
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsSpeaking(true);

    // Generate voice for welcome message
    try {
      const audioUrl = await elevenLabsService.generateVoice(welcomeMessage, 'rachel');
      if (!isMuted && audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
        setTimeout(() => setIsSpeaking(false), 3000);
      }
    } catch (error) {
      console.error('Error generating welcome voice:', error);
      setIsSpeaking(false);
    }
  };

  const stopVideoCall = () => {
    setIsVideoCall(false);
    setIsSpeaking(false);
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden ${
        isMinimized ? 'w-80 h-16' : isVideoCall ? 'w-[500px] h-[700px]' : 'w-96 h-[600px]'
      } transition-all duration-300`}
    >
      {/* Video Call Interface */}
      {isVideoCall && !isMinimized ? (
        <div className="h-full flex flex-col">
          {/* Video Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Bot className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-purple-100">Video Call Active</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">4:45</span>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Avatar Video Area */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Main Avatar Display */}
            <div className="absolute inset-4 bg-gray-800 rounded-2xl overflow-hidden">
              <div className="relative w-full h-full">
                {/* Avatar Image/Video */}
                <img
                  src={avatarVideo}
                  alt="AI Avatar"
                  className="w-full h-full object-cover"
                />
                
                {/* Speaking Animation Overlay */}
                <AnimatePresence>
                  {isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-blue-500/20 via-transparent to-purple-500/20"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 border-4 border-blue-400 rounded-2xl"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Speaking Indicator */}
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <span className="text-sm font-medium text-gray-800">Speaking</span>
                    </div>
                  </motion.div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-4 right-4"
                  >
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Small User Video (Picture-in-Picture) */}
            <div className="absolute top-6 right-6 w-24 h-32 bg-gray-700 rounded-lg overflow-hidden border-2 border-white/20">
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <span className="text-white text-xs">You</span>
              </div>
            </div>
          </div>

          {/* Video Call Controls */}
          <div className="p-6 bg-gray-900">
            <div className="flex items-center justify-center space-x-6">
              {/* Microphone Control */}
              <motion.button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-full transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isRecording ? (
                  <MicOff className="h-6 w-6 text-white" />
                ) : (
                  <Mic className="h-6 w-6 text-white" />
                )}
              </motion.button>

              {/* Audio Control */}
              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? (
                  <VolumeX className="h-6 w-6 text-white" />
                ) : (
                  <Volume2 className="h-6 w-6 text-white" />
                )}
              </motion.button>

              {/* End Call */}
              <motion.button
                onClick={stopVideoCall}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </motion.button>
            </div>

            {/* Powered by Tavus */}
            <div className="flex items-center justify-center mt-4">
              <span className="text-xs text-gray-400">Powered by </span>
              <span className="text-xs text-orange-400 font-semibold ml-1">tavus</span>
            </div>
          </div>
        </div>
      ) : (
        /* Regular Chat Interface */
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Bot className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-purple-100">Powered by CreatorCopilot</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-white" />
                ) : (
                  <Volume2 className="h-4 w-4 text-white" />
                )}
              </button>
              
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4 text-white" />
                ) : (
                  <Minimize2 className="h-4 w-4 text-white" />
                )}
              </button>
              
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.audioUrl && message.type === 'ai' && (
                        <button
                          onClick={() => playAudio(message.audioUrl!)}
                          className="mt-2 flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Play audio</span>
                        </button>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full transition-colors ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  
                  <button
                    onClick={startVideoCall}
                    className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:from-green-600 hover:to-emerald-600 transition-all"
                    title="Start Video Call"
                  >
                    <Video className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => handleSendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
                  <span>Powered by</span>
                  <span className="font-medium">Tavus</span>
                  <span>•</span>
                  <span className="font-medium">ElevenLabs</span>
                  <span>•</span>
                  <span className="font-medium">OpenAI</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}