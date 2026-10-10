import { describe, it, expect, beforeEach } from 'vitest';
import { PacketRouter } from '../packetRouter';
import type { MeshPacket } from '../types';

describe('PacketRouter - Mesh Protocol Tests', () => {
  let router: PacketRouter;

  beforeEach(() => {
    router = new PacketRouter({ nodeId: 'node-laptop' });
  });

  describe('1. Packet Creation', () => {
    it('should create a valid broadcast packet with default TTL and 0 hops', () => {
      const packet = router.createPacket('*', 'Hello Mesh');

      expect(packet.id).toBeDefined();
      expect(packet.id.length).toBeGreaterThan(0);
      expect(packet.origin).toBe('node-laptop');
      expect(packet.destination).toBe('*');
      expect(packet.ttl).toBe(5);
      expect(packet.hopCount).toBe(0);
      expect(packet.payload).toBe('Hello Mesh');
      expect(packet.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should pre-record own created packets to prevent self-loop reflection', () => {
      const packet = router.createPacket('*', 'Ping');
      
      // If packet bounces back to origin
      const result = router.processPacket(packet);
      expect(result.action).toBe('DROPPED_DUPLICATE');
    });
  });

  describe('2. Serialization & Strict Schema Validation', () => {
    it('should serialize and deserialize valid packets losslessly', () => {
      const packet = router.createPacket('node-phone', 'Secret Data');
      const json = router.serialize(packet);
      const restored = router.deserialize(json);

      expect(restored).toEqual(packet);
    });

    it('should reject malformed packets missing required fields', () => {
      expect(router.deserialize('{}')).toBeNull();
      expect(router.deserialize('{"id": "123", "payload": "hi"}')).toBeNull();
      expect(router.deserialize('not-json')).toBeNull();
    });

    it('should reject packets with non-integer TTL or negative hop counts', () => {
      const invalidTtl = JSON.stringify({
        id: '1', origin: 'a', destination: 'b',
        ttl: 2.5, hopCount: 0, timestamp: Date.now(), payload: 'text'
      });
      expect(router.deserialize(invalidTtl)).toBeNull();

      const negativeHops = JSON.stringify({
        id: '1', origin: 'a', destination: 'b',
        ttl: 3, hopCount: -1, timestamp: Date.now(), payload: 'text'
      });
      expect(router.deserialize(negativeHops)).toBeNull();
    });

    it('should fall back gracefully to a synthetic envelope for raw simulator text', () => {
      const fallback = router.parseIncoming('raw hello from phone', 'phone');
      expect(fallback.origin).toBe('phone');
      expect(fallback.payload).toBe('raw hello from phone');
      expect(fallback.destination).toBe('*');
      expect(fallback.ttl).toBe(5);
    });
  });

  describe('3. Duplicate Detection & Suppression', () => {
    it('should accept the first packet and drop the identical duplicate', () => {
      const packet: MeshPacket = {
        id: 'unique-packet-999',
        origin: 'phone-alice',
        destination: '*',
        ttl: 5,
        hopCount: 1,
        timestamp: Date.now(),
        payload: 'Duplicate Test',
      };

      const firstPass = router.processPacket(packet);
      expect(firstPass.action).toBe('ACCEPTED_LOCAL');

      const secondPass = router.processPacket(packet);
      expect(secondPass.action).toBe('DROPPED_DUPLICATE');
      expect(secondPass.reason).toContain('already processed');
    });
  });

  describe('4. Destination Routing & Hop Decrement', () => {
    it('should accept packets addressed directly to this node', () => {
      const packet: MeshPacket = {
        id: 'msg-direct-1',
        origin: 'phone-alice',
        destination: 'node-laptop',
        ttl: 4,
        hopCount: 1,
        timestamp: Date.now(),
        payload: 'Private DM',
      };

      const result = router.processPacket(packet);
      expect(result.action).toBe('ACCEPTED_LOCAL');
    });

    it('should prepare relay with decremented TTL and incremented hops when addressed to another node', () => {
      const packet: MeshPacket = {
        id: 'msg-foreign-1',
        origin: 'phone-alice',
        destination: 'phone-bob', // Not us!
        ttl: 4,
        hopCount: 1,
        timestamp: Date.now(),
        payload: 'Relay through laptop',
      };

      const result = router.processPacket(packet);
      expect(result.action).toBe('RELAY_NEEDED');
      expect(result.packet.ttl).toBe(3); // 4 -> 3
      expect(result.packet.hopCount).toBe(2); // 1 -> 2
    });
  });

  describe('5. TTL Loop-Breaker & Expiration', () => {
    it('should drop foreign packets when TTL is 1 (cannot jump further)', () => {
      const dyingPacket: MeshPacket = {
        id: 'msg-dying-1',
        origin: 'phone-alice',
        destination: 'phone-bob',
        ttl: 1,
        hopCount: 4,
        timestamp: Date.now(),
        payload: 'Dying packet',
      };

      const result = router.processPacket(dyingPacket);
      expect(result.action).toBe('DROPPED_TTL_EXPIRED');
    });

    it('should reject packets with TTL <= 0 immediately', () => {
      const deadPacket: MeshPacket = {
        id: 'msg-dead-1',
        origin: 'phone-alice',
        destination: '*',
        ttl: 0,
        hopCount: 5,
        timestamp: Date.now(),
        payload: 'Dead on arrival',
      };

      const result = router.processPacket(deadPacket);
      expect(result.action).toBe('DROPPED_TTL_EXPIRED');
    });
  });

  describe('6. Bounded & Expiring Cache', () => {
    it('should evict oldest entries when reaching maxCacheSize', () => {
      const smallCacheRouter = new PacketRouter({
        nodeId: 'bounded-node',
        maxCacheSize: 3,
      });

      smallCacheRouter.createPacket('*', 'Msg 1'); // Seen 1
      smallCacheRouter.createPacket('*', 'Msg 2'); // Seen 2
      smallCacheRouter.createPacket('*', 'Msg 3'); // Seen 3
      smallCacheRouter.createPacket('*', 'Msg 4'); // Evicts 1, leaves 2, 3, 4

      expect(smallCacheRouter.getSeenCacheSize()).toBe(3);
    });
  });
});
