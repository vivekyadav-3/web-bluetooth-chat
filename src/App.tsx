import { useState, useCallback, useMemo } from 'react';
import { ConnectButton } from './components/ConnectButton';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { MeshSimulator } from './components/MeshSimulator';
import { bleManager } from './bluetooth/bleManager';
import { PacketRouter } from './mesh/packetRouter';
import type { BluetoothConnectionState, ChatMessage } from './types/message';
import type { ProcessResult } from './mesh/types';

export function App() {
  const router = useMemo(() => new PacketRouter('my-laptop'), []);
  const [packetLogs, setPacketLogs] = useState<ProcessResult[]>([]);

  const [connectionState, setConnectionState] = useState<BluetoothConnectionState>({
    status: 'disconnected',
    deviceName: null,
    errorMessage: null,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Callback when a Bluetooth notification is received from the Phone
  const handleMessageReceived = useCallback((rawPayload: string) => {
    // 1. Pass incoming Bluetooth bytes through our Mesh Packet Router
    const packet = router.parseIncoming(rawPayload, 'phone');
    const result = router.processPacket(packet);

    // 2. Add to mesh debugger packet logs
    setPacketLogs((prev) => [result, ...prev]);

    // 3. Only deliver to user chat if packet is accepted locally (not duplicate or expired)
    if (result.action === 'ACCEPTED_LOCAL') {
      const newMessage: ChatMessage = {
        id: packet.id,
        sender: 'phone',
        text: packet.payload,
        timestamp: packet.timestamp || Date.now(),
        origin: packet.origin,
        destination: packet.destination,
        ttl: packet.ttl,
        hopCount: packet.hopCount,
      };
      setMessages((prev) => [...prev, newMessage]);
    }
  }, [router]);

  // Callback when the BLE device disconnects
  const handleDisconnected = useCallback(() => {
    setConnectionState({
      status: 'disconnected',
      deviceName: null,
      errorMessage: 'Device was disconnected.',
    });
  }, []);

  // Handle Connect click
  const handleConnect = async () => {
    setConnectionState({
      status: 'connecting',
      deviceName: null,
      errorMessage: null,
    });

    try {
      const deviceName = await bleManager.connect(
        handleMessageReceived,
        handleDisconnected
      );

      setConnectionState({
        status: 'connected',
        deviceName,
        errorMessage: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Bluetooth device.';
      setConnectionState({
        status: 'error',
        deviceName: null,
        errorMessage: message,
      });
    }
  };

  // Handle Disconnect click
  const handleDisconnect = () => {
    bleManager.disconnect();
    setConnectionState({
      status: 'disconnected',
      deviceName: null,
      errorMessage: null,
    });
  };

  // Handle sending a message: wraps text in MeshPacket envelope before BLE transmission
  const handleSendMessage = async (text: string) => {
    try {
      // 1. Create a structured MeshPacket
      const packet = router.createPacket('*', text);
      const serialized = router.serialize(packet);

      // 2. Send over Bluetooth Low Energy
      await bleManager.sendMessage(serialized);

      // 3. Log the outgoing packet in our mesh debugger
      const outgoingResult: ProcessResult = {
        action: 'ACCEPTED_LOCAL',
        packet,
        reason: 'Origin node broadcast',
      };
      setPacketLogs((prev) => [outgoingResult, ...prev]);

      // 4. Add to chat UI
      const newMessage: ChatMessage = {
        id: packet.id,
        sender: 'laptop',
        text: packet.payload,
        timestamp: packet.timestamp,
        origin: packet.origin,
        destination: packet.destination,
        ttl: packet.ttl,
        hopCount: packet.hopCount,
      };
      setMessages((prev) => [...prev, newMessage]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message.';
      setConnectionState((prev) => ({
        ...prev,
        errorMessage: message,
      }));
    }
  };

  // Handle clearing messages
  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>📡 Web Bluetooth Chat</h1>
        <p style={{ color: '#718096', fontSize: '14px', marginTop: '4px' }}>
          Mesh Protocol Layer Active • Laptop ({router.myNodeId}) ↔ Phone
        </p>
      </header>

      <ConnectButton
        connectionState={connectionState}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <ChatWindow
        messages={messages}
        onClearChat={handleClearChat}
      />

      <MessageInput
        disabled={connectionState.status !== 'connected'}
        onSendMessage={handleSendMessage}
      />

      {/* Collapsible Mesh Protocol Debugger */}
      <MeshSimulator
        router={router}
        logs={packetLogs}
        onAddLog={(result) => setPacketLogs((prev) => [result, ...prev])}
        onClearLogs={() => setPacketLogs([])}
      />
    </div>
  );
}

export default App;
