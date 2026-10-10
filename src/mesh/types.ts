export interface MeshPacket {
  id: string;          // Unique packet ID (UUID or hash) to detect duplicates
  origin: string;      // ID of the device that created the message (e.g. 'laptop-1')
  destination: string; // Target device ID, or '*' for public broadcast
  ttl: number;         // Time-To-Live: max hops remaining before packet is dropped
  hopCount: number;    // Number of relays this packet has travelled through
  timestamp: number;   // Epoch timestamp when originally created
  payload: string;     // The actual message text (can be encrypted in the future)
}

export type PacketAction =
  | 'ACCEPTED_LOCAL'       // Packet is addressed to us (or broadcast) -> display in chat
  | 'RELAY_NEEDED'        // Packet is addressed to someone else -> forward to neighbors
  | 'DROPPED_DUPLICATE'   // We have already seen this packet ID -> discard
  | 'DROPPED_TTL_EXPIRED';// TTL hit 0 -> discard to prevent infinite network loops

export interface ProcessResult {
  action: PacketAction;
  packet: MeshPacket;
  reason?: string;
}
