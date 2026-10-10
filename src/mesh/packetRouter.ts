import type { MeshPacket, ProcessResult } from './types';

export interface RouterOptions {
  nodeId?: string;
  cacheTtlMs?: number;    // Expiration window for duplicate packet IDs (default: 5 mins)
  maxCacheSize?: number;  // Bounded cache capacity to prevent memory leaks (default: 500)
}

export class PacketRouter {
  public readonly myNodeId: string;
  // Bounded Map: packetId -> expiration timestamp (ms)
  private seenCache = new Map<string, number>();
  private readonly cacheTtlMs: number;
  private readonly maxCacheSize: number;

  constructor(options: RouterOptions = {}) {
    this.myNodeId = options.nodeId || 'node-' + Math.random().toString(36).substring(2, 8);
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = options.maxCacheSize ?? 500;
  }

  // Create a new outgoing mesh packet
  createPacket(destination: string = '*', payload: string, maxHops: number = 5): MeshPacket {
    const packet: MeshPacket = {
      id: crypto.randomUUID(),
      origin: this.myNodeId,
      destination,
      ttl: Math.max(1, maxHops),
      hopCount: 0,
      timestamp: Date.now(),
      payload,
    };

    // Record our own outgoing packet in the duplicate cache
    this.markAsSeen(packet.id);
    return packet;
  }

  // Process an incoming packet
  processPacket(packet: MeshPacket): ProcessResult {
    // 1. Basic schema sanity check
    if (!this.isValidPacket(packet)) {
      return {
        action: 'DROPPED_TTL_EXPIRED',
        packet,
        reason: 'Malformed packet schema.',
      };
    }

    // 2. Check for duplicate packet
    if (this.isDuplicate(packet.id)) {
      return {
        action: 'DROPPED_DUPLICATE',
        packet,
        reason: 'Packet already processed earlier.',
      };
    }

    // 3. Check for expired TTL
    if (packet.ttl <= 0) {
      return {
        action: 'DROPPED_TTL_EXPIRED',
        packet,
        reason: 'Packet TTL is 0 or negative.',
      };
    }

    // Record packet as seen now that initial checks passed
    this.markAsSeen(packet.id);

    // 4. Check if packet is addressed to this node or a public broadcast
    const isForMe = packet.destination === this.myNodeId || packet.destination === '*';

    if (isForMe) {
      return {
        action: 'ACCEPTED_LOCAL',
        packet,
      };
    }

    // 5. Foreign packet -> Check if it has hops remaining to relay
    if (packet.ttl <= 1) {
      return {
        action: 'DROPPED_TTL_EXPIRED',
        packet,
        reason: 'TTL expired. Packet will not be relayed further.',
      };
    }

    // 6. Decrement TTL and increment hop count for relay
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

  // Strict Schema Validation
  isValidPacket(obj: unknown): obj is MeshPacket {
    if (!obj || typeof obj !== 'object') return false;
    const p = obj as Record<string, unknown>;

    return (
      typeof p.id === 'string' && p.id.trim().length > 0 &&
      typeof p.origin === 'string' && p.origin.trim().length > 0 &&
      typeof p.destination === 'string' && p.destination.trim().length > 0 &&
      typeof p.ttl === 'number' && Number.isInteger(p.ttl) &&
      typeof p.hopCount === 'number' && Number.isInteger(p.hopCount) && p.hopCount >= 0 &&
      typeof p.timestamp === 'number' && p.timestamp > 0 &&
      typeof p.payload === 'string'
    );
  }

  // Serialization helpers for transport
  serialize(packet: MeshPacket): string {
    return JSON.stringify(packet);
  }

  deserialize(rawString: string): MeshPacket | null {
    try {
      const parsed = JSON.parse(rawString);
      return this.isValidPacket(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // Parse incoming Bluetooth payload: handles both valid MeshPacket and raw simulator text
  parseIncoming(rawString: string, fallbackOrigin: string = 'phone'): MeshPacket {
    const deserialized = this.deserialize(rawString);
    if (deserialized) {
      return deserialized;
    }

    // Fallback: wrap raw text from simulator into a valid MeshPacket
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

  // Bounded & Expiring Duplicate Cache Management
  private isDuplicate(packetId: string): boolean {
    this.evictExpired();
    return this.seenCache.has(packetId);
  }

  private markAsSeen(packetId: string): void {
    // If cache exceeded max size, evict oldest entries
    if (this.seenCache.size >= this.maxCacheSize) {
      const oldestKey = this.seenCache.keys().next().value;
      if (oldestKey) this.seenCache.delete(oldestKey);
    }

    this.seenCache.set(packetId, Date.now() + this.cacheTtlMs);
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [id, expiresAt] of this.seenCache.entries()) {
      if (now > expiresAt) {
        this.seenCache.delete(id);
      } else {
        // Since entries are added sequentially, earlier entries expire first
        break;
      }
    }
  }

  getSeenCacheSize(): number {
    this.evictExpired();
    return this.seenCache.size;
  }

  clearSeenCache(): void {
    this.seenCache.clear();
  }
}
