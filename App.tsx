import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, Sender } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import BotIcon from './components/icons/BotIcon';
import TrashIcon from './components/icons/TrashIcon';

const CHAT_HISTORY_KEY = 'gemini-chat-history';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevIsLoadingRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const startNewChat = useCallback(() => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful and friendly AI assistant. Your responses should be informative and concise, formatted in markdown.',
        },
      });
      // Start with an empty chat
      setMessages([]);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('Failed to initialize AI chat. Please check your API key and refresh the page.');
    }
  }, []);

  useEffect(() => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const savedMessagesJSON = localStorage.getItem(CHAT_HISTORY_KEY);

      if (savedMessagesJSON) {
        const savedMessages: Message[] = JSON.parse(savedMessagesJSON);
        if (savedMessages.length > 0) {
          setMessages(savedMessages);

          const history = savedMessages
            .map(msg => ({
              role: msg.sender === Sender.User ? 'user' : 'model',
              parts: [{ text: msg.text }],
            }));

          chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
            config: {
              systemInstruction: 'You are a helpful and friendly AI assistant. Your responses should be informative and concise, formatted in markdown.',
            },
          });
          return;
        }
      }

      startNewChat();
    } catch (e: any) {
      console.error(e);
      setError('Failed to initialize AI chat. Please check your API key and refresh the page.');
    }
  }, [startNewChat]);

  // OPTIMIZATION: Only save to localStorage after a message stream is complete.
  useEffect(() => {
    // This effect triggers when isLoading changes from true to false.
    if (prevIsLoadingRef.current && !isLoading && messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
    // Keep track of the previous isLoading state.
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, messages]);
  
  const handleClearChat = () => {
    if (isLoading) return;
    localStorage.removeItem(CHAT_HISTORY_KEY);
    startNewChat();
  };

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: Sender.User,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: inputText });

      let aiResponseText = '';
      const aiMessageId = `ai-${Date.now()}`;
      
      // Add a placeholder for the AI message first
      setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: Sender.AI }]);

      for await (const chunk of stream) {
        aiResponseText += chunk.text;
        // OPTIMIZATION: More efficient state update for the streaming message
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.id === aiMessageId) {
            const updatedLastMessage = { ...lastMessage, text: aiResponseText };
            return [...prev.slice(0, -1), updatedLastMessage];
          }
          return prev;
        });
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = 'An error occurred while fetching the response. Please try again.';
      setError(errorMessage);
      setMessages(prev => [...prev, {id: `error-${Date.now()}`, text: errorMessage, sender: Sender.AI}])
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-black font-sans">
      <header className="bg-yellow-300 text-black border-b-4 border-black p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border-2 border-black">
                <BotIcon className="w-7 h-7 text-yellow-300"/>
            </div>
            <div>
                <h1 className="text-2xl font-bold">Gemini AI Chat</h1>
            </div>
        </div>
        <button
            onClick={handleClearChat}
            disabled={isLoading}
            className="p-2 text-black hover:bg-black hover:text-yellow-300 border-2 border-black rounded-lg neo-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear chat history"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col space-y-4">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      {error && <div className="p-4 text-center text-red-700 bg-red-100 border-t-2 border-red-200">{error}</div>}

      <footer className="p-4 bg-white border-t-4 border-black">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
};

export default App;