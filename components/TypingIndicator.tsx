import React from 'react';
import BotIcon from './icons/BotIcon';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 justify-start">
        <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center flex-shrink-0">
          <BotIcon className="w-6 h-6 text-black" />
        </div>
        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border-2 border-black neo-shadow flex items-center space-x-1.5">
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
        </div>
    </div>
  );
};

export default TypingIndicator;