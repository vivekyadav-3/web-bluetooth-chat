export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error';

export interface ChatMessage {
  id: string;
  sender: 'laptop' | 'phone';
  text: string;
  timestamp: number;
  origin?: string;
  destination?: string;
  ttl?: number;
  hopCount?: number;
}

export interface BluetoothConnectionState {
  status: ConnectionStatus;
  deviceName: string | null;
  errorMessage: string | null;
}
