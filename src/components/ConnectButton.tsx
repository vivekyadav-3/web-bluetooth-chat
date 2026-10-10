import type { BluetoothConnectionState } from '../types/message';

interface ConnectButtonProps {
  connectionState: BluetoothConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectButton = ({
  connectionState,
  onConnect,
  onDisconnect,
}: ConnectButtonProps) => {
  const { status, deviceName, errorMessage } = connectionState;

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {status === 'connected' ? (
          <button
            onClick={onDisconnect}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e53e3e',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={status === 'connecting'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3182ce',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'connecting' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'connecting' ? 'Connecting...' : 'Connect Bluetooth Device'}
          </button>
        )}

        <span>
          Status: <strong>{status}</strong>
          {deviceName && ` (${deviceName})`}
        </span>
      </div>

      {errorMessage && (
        <div style={{ marginTop: '10px', color: '#e53e3e', fontSize: '14px' }}>
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
};
