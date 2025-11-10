import React from 'react';
import { Message, Sender } from '../types';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';

// Simple markdown-to-html adjusted for the new theme
const SimpleMarkdown: React.FC<{ text: string; isUser: boolean }> = React.memo(({ text, isUser }) => {
    const codeClass = isUser ? 'bg-blue-700/50' : 'bg-gray-200';
    const html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italic
        .replace(/`([^`]+)`/g, `<code class="${codeClass} rounded px-1 py-0.5 text-sm font-mono">$1</code>`) // Inline code
        .replace(/\n/g, '<br />'); // Newlines

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
});
SimpleMarkdown.displayName = 'SimpleMarkdown';


const ChatMessage: React.FC<{ message: Message }> = React.memo(({ message }) => {
  const isUser = message.sender === Sender.User;

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center flex-shrink-0">
          <BotIcon className="w-6 h-6 text-black" />
        </div>
      )}
      
      <div 
        className={`max-w-md lg:max-w-2xl rounded-2xl px-4 py-3 border-2 border-black neo-shadow ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-white text-black rounded-bl-none'
        }`}
      >
        <div className={`prose prose-sm leading-relaxed ${isUser ? 'prose-invert' : 'prose-stone'}`}>
            <SimpleMarkdown text={message.text} isUser={isUser} />
        </div>
      </div>
      
      {isUser && (
         <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
});
ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;