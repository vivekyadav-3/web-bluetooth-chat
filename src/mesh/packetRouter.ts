import type { MeshPacket, ProcessResult } from './types';

export class PacketRouter {
  public readonly myNodeId: string;
  private seenPacketIds = new Set<string>();

  constructor(nodeId?: string) {
    // Generate a unique 6-character node ID for this device if not provided
    this.myNodeId = nodeId || 'node-' + Math.random().toString(36).substring(2, 8);
  }

  // Create a new outgoing mesh packet
  createPacket(destination: string = '*', payload: string, maxHops: number = 5): MeshPacket {
    const packet: MeshPacket = {
      id: crypto.randomUUID(),
      origin: this.myNodeId,
      destination,
      ttl: maxHops,
      hopCount: 0,
      timestamp: Date.now(),
      payload,
    };

    // Mark our own packet as seen so we never re-process it if it bounces back
    this.seenPacketIds.add(packet.id);
    return packet;
  }

  // Process a packet received from the Bluetooth transport
  processPacket(packet: MeshPacket): ProcessResult {
    // 1. Check for duplicates
    if (this.seenPacketIds.has(packet.id)) {
      return {
        action: 'DROPPED_DUPLICATE',
        packet,
        reason: 'Packet already processed earlier.',
      };
    }

    // Add to seen cache
    this.seenPacketIds.add(packet.id);

    // 2. Check if addressed to us or a public broadcast
    const isForMe = packet.destination === this.myNodeId || packet.destination === '*';

    if (isForMe) {
      return {
        action: 'ACCEPTED_LOCAL',
        packet,
      };
    }

    // 3. Not for us -> Check TTL before relaying
    if (packet.ttl <= 1) {
      return {
        action: 'DROPPED_TTL_EXPIRED',
        packet,
        reason: 'TTL expired. Packet will not be relayed further.',
      };
    }

    // 4. Prepare for relay: decrement TTL, increment hop count
    const relayedPacket: MeshPacket = {
      ...packet,
      ttl: packet.ttl - 1,
      hopCount: packet.hopCount + 1,
    };

    return {
      action: 'RELAY_NEEDED',
      packet: relayedPacket,
    };
  }

  // Serialization helpers for Bluetooth transport
  serialize(packet: MeshPacket): string {
    return JSON.stringify(packet);
  }

  deserialize(rawString: string): MeshPacket | null {
    try {
      const parsed = JSON.parse(rawString);
      if (parsed && parsed.id && parsed.origin && parsed.payload) {
        return parsed as MeshPacket;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Parse incoming Bluetooth payload: handles both JSON MeshPacket and raw fallback text
  parseIncoming(rawString: string, fallbackOrigin: string = 'phone'): MeshPacket {
    const deserialized = this.deserialize(rawString);
    if (deserialized) {
      return deserialized;
    }

    // If phone simulator sent plain text like "hi", wrap it into a valid MeshPacket
    return {
      id: crypto.randomUUID(),
      origin: fallbackOrigin,
      destination: '*',
      ttl: 5,
      hopCount: 1,
      timestamp: Date.now(),
      payload: rawString,
    };
  }

  // Clear memory cache if needed
  clearSeenCache(): void {
    this.seenPacketIds.clear();
  }
}
