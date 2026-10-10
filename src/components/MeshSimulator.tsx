import { useState } from 'react';
import type { PacketRouter } from '../mesh/packetRouter';
import type { ProcessResult } from '../mesh/types';

interface MeshSimulatorProps {
  router: PacketRouter;
  logs: ProcessResult[];
  onAddLog: (result: ProcessResult) => void;
  onClearLogs: () => void;
}

export const MeshSimulator = ({
  router,
  logs = [],
  onAddLog,
  onClearLogs,
}: MeshSimulatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('Secret Mesh Alert');
  const [destination, setDestination] = useState('*');

  // 1. Simulate sending a normal broadcast packet
  const handleSendBroadcast = () => {
    const packet = router.createPacket(destination, testMessage);
    const result = router.processPacket(packet);
    onAddLog(result);
  };

  // 2. Simulate receiving a packet meant for someone else (Relay Test)
  const handleSimulateRelay = () => {
    const foreignPacket = {
      id: crypto.randomUUID(),
      origin: 'phone-alice',
      destination: 'phone-bob',
      ttl: 3,
      hopCount: 1,
      timestamp: Date.now(),
      payload: testMessage,
    };

    const result = router.processPacket(foreignPacket);
    onAddLog(result);
  };

  // 3. Simulate sending an identical duplicate packet
  const handleSimulateDuplicate = () => {
    const fixedId = 'duplicate-test-packet-id-123';
    const packet = {
      id: fixedId,
      origin: 'phone-carol',
      destination: router.myNodeId,
      ttl: 4,
      hopCount: 1,
      timestamp: Date.now(),
      payload: 'Duplicate Attack!',
    };

    const result = router.processPacket(packet);
    onAddLog(result);
  };

  // 4. Simulate a dying packet with TTL = 1
  const handleSimulateTTLExpired = () => {
    const dyingPacket = {
      id: crypto.randomUUID(),
      origin: 'distant-phone',
      destination: 'someone-else',
      ttl: 1,
      hopCount: 4,
      timestamp: Date.now(),
      payload: 'Fading Signal...',
    };

    const result = router.processPacket(dyingPacket);
    onAddLog(result);
  };

  const getBadgeColor = (action: string) => {
    switch (action) {
      case 'ACCEPTED_LOCAL':
        return '#38a169'; // Green
      case 'RELAY_NEEDED':
        return '#3182ce'; // Blue
      case 'DROPPED_DUPLICATE':
        return '#d69e2e'; // Amber
      case 'DROPPED_TTL_EXPIRED':
        return '#e53e3e'; // Red
      default:
        return '#718096';
    }
  };

  return (
    <div style={{ marginTop: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Collapsible Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          border: 'none',
          borderBottom: isOpen ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '13px',
          fontWeight: 600,
          color: '#4a5568',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🕸️ Mesh Protocol Debugger</span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: logs.length > 0 ? '#ebf8ff' : '#edf2f7',
              color: logs.length > 0 ? '#2b6cb0' : '#718096',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {logs.length} packet events
          </span>
        </span>
        <span style={{ fontSize: '12px', color: '#718096' }}>
          {isOpen ? '▲ Hide Debugger' : '▼ Show Debugger'}
        </span>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div style={{ padding: '16px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#718096' }}>
              My Node ID: <strong style={{ color: '#2d3748' }}>{router.myNodeId}</strong>
            </span>
            <button
              onClick={() => {
                router.clearSeenCache();
                onClearLogs();
              }}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid #cbd5e0',
                color: '#718096',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Clear Logs & Cache
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test Payload"
              style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', flex: 1, fontSize: '12px' }}
            />
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '12px' }}
            >
              <option value="*">Broadcast (*)</option>
              <option value="phone-bob">Private (phone-bob)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button
              onClick={handleSendBroadcast}
              style={{ padding: '5px 10px', backgroundColor: '#38a169', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              1. Test Send
            </button>
            <button
              onClick={handleSimulateRelay}
              style={{ padding: '5px 10px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              2. Test Relay
            </button>
            <button
              onClick={handleSimulateDuplicate}
              style={{ padding: '5px 10px', backgroundColor: '#d69e2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              3. Test Duplicate
            </button>
            <button
              onClick={handleSimulateTTLExpired}
              style={{ padding: '5px 10px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              4. Test TTL Expired
            </button>
          </div>

          {/* Live Packet Log Feed */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#a0aec0', padding: '16px', fontSize: '12px' }}>
                No packets processed yet. Send a chat message or click test buttons above!
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    borderLeft: `4px solid ${getBadgeColor(log.action)}`,
                    backgroundColor: '#f7fafc',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: getBadgeColor(log.action) }}>
                      [{log.action}]
                    </span>
                    <span style={{ fontSize: '10px', color: '#a0aec0' }}>
                      TTL: {log.packet.ttl} • Hops: {log.packet.hopCount}
                    </span>
                  </div>
                  <div style={{ marginTop: '2px', color: '#2d3748' }}>
                    "{log.packet.payload}"
                  </div>
                  <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                    From: <code>{log.packet.origin}</code> ➔ To: <code>{log.packet.destination}</code>
                    {log.reason && ` • (${log.reason})`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
