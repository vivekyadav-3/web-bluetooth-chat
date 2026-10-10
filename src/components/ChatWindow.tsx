import type { ChatMessage } from '../types/message';

interface ChatWindowProps {
  messages: ChatMessage[];
  onClearChat: () => void;
}

export const ChatWindow = ({ messages, onClearChat }: ChatWindowProps) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          backgroundColor: '#f7fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontWeight: 600, color: '#4a5568' }}>Messages ({messages.length})</span>
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            style={{
              padding: '4px 10px',
              backgroundColor: 'transparent',
              border: '1px solid #cbd5e0',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#718096',
            }}
          >
            Clear Chat
          </button>
        )}
      </div>

      <div
        style={{
          height: '350px',
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#a0aec0', marginTop: '140px', fontSize: '14px' }}>
            No messages yet. Connect your device and send a message!
          </div>
        ) : (
          messages.map((msg) => {
            const isLaptop = msg.sender === 'laptop';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isLaptop ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: isLaptop ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    backgroundColor: isLaptop ? '#3182ce' : '#edf2f7',
                    color: isLaptop ? '#ffffff' : '#2d3748',
                    wordBreak: 'break-word',
                  }}
                >
                  <div style={{ fontSize: '14px' }}>{msg.text}</div>
                </div>
                <span style={{ fontSize: '10px', color: '#a0aec0', marginTop: '4px' }}>
                  {msg.origin || (isLaptop ? 'Laptop' : 'Phone')} • {formatTime(msg.timestamp)}
                  {msg.hopCount !== undefined && ` • ${msg.hopCount} hop${msg.hopCount === 1 ? '' : 's'}`}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
