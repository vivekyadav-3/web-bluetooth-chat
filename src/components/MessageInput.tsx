import { useState } from 'react';

interface MessageInputProps {
  disabled: boolean;
  onSendMessage: (text: string) => void;
}

export const MessageInput = ({ disabled, onSendMessage }: MessageInputProps) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
      <input
        type="text"
        placeholder={disabled ? 'Connect to Bluetooth first...' : 'Type a message (e.g. Hello Phone)...'}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '14px',
          outline: 'none',
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !inputText.trim()}
        style={{
          padding: '10px 20px',
          backgroundColor: disabled || !inputText.trim() ? '#a0aec0' : '#38a169',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: disabled || !inputText.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        Send
      </button>
    </div>
  );
};
