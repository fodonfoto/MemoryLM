import React from 'react';
import { marked } from 'marked';
import { ChatMessage } from './types';

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  chatHistoryRef: React.RefObject<HTMLDivElement>;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  sourcesAvailable: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatHistory,
  chatHistoryRef,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  isLoading,
  sourcesAvailable,
}) => {
  return (
    <div className="panel chat-panel">
      <div className="panel-header">
        <span className="material-symbols-outlined">chat</span>
        <h2>Chat</h2>
      </div>
      <div className="chat-history" ref={chatHistoryRef}>
          {chatHistory.length > 0 ? (
              chatHistory.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}`}>
                      <div className="role">
                          <span className="material-symbols-outlined">{msg.role === 'user' ? 'person' : 'robot_2'}</span>
                          {msg.role}
                      </div>
                      <div className="message-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }}></div>
                  </div>
              ))
          ) : (
              <div className="placeholder-text">
                  <span className="material-symbols-outlined">forum</span>
                  <p>{sourcesAvailable ? "Ask a question about your sources." : "Upload sources to begin chatting."}</p>
              </div>
          )}
      </div>
      <div className="chat-input-area">
        <textarea
          className="chat-input"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder={sourcesAvailable ? "Type your message..." : "Please add sources first"}
          onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
          rows={1}
          disabled={!sourcesAvailable || isLoading}
          aria-label="Chat input"
        />
        <button className="send-btn" onClick={handleSendMessage} disabled={!sourcesAvailable || isLoading || !currentMessage.trim()}>
          {isLoading ? <div className="loader small-loader"></div> : <span className="material-symbols-outlined">send</span>}
        </button>
      </div>
    </div>
  );
};