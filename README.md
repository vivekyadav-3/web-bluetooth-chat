# Web Bluetooth Mesh Chat

> Offline Bluetooth messaging prototype built with **React**, **TypeScript**, **Vite**, and the **Web Bluetooth API**, featuring an experimental mesh packet routing protocol.

---

## 📡 Overview

**Web Bluetooth Mesh Chat** is a browser-based prototype designed to explore direct device-to-device offline communication without the internet, cellular networks, or centralized cloud servers.

The application uses Google Chrome's native **Web Bluetooth API** (Central GATT client) to establish a direct Bluetooth Low Energy link with an Android phone acting as a BLE peripheral, streaming UTF-8 text and emoji messages over custom GATT characteristics. It also features a client-side mesh packet routing layer modeled after decentralized gossip protocols like **Bitchat** and **Bridgefy**.

---

## ✨ Features

- **100% Pure Offline Transport:** Operates directly over 2.4 GHz Bluetooth Low Energy radio waves with Wi-Fi and mobile data completely disabled.
- **Bi-directional BLE GATT Streaming:**
  - **Laptop ➔ Phone:** Encodes text using `TextEncoder` and writes bytes to a writable GATT characteristic.
  - **Phone ➔ Laptop:** Subscribes to notifications via `characteristicvaluechanged` and decodes incoming byte streams with `TextDecoder`.
- **Fault-Tolerant Connection Handling:** Real-time listeners for `gattserverdisconnected` handle out-of-range signal drops and physical reconnection while preserving chat history in React state.
- **Experimental Bitchat Mesh Protocol Layer:**
  - **Structured Packet Envelopes:** Every message carries `id`, `origin`, `destination`, `ttl`, `hopCount`, and `timestamp`.
  - **Duplicate Suppression:** An in-memory cache drops duplicate packets to prevent broadcast storms and infinite routing loops.
  - **TTL Loop-Breaker:** Automatically decrements packet Time-To-Live (TTL) on each hop and drops dying packets (`TTL <= 1`).
  - **Hop Counting:** Measures and displays relay distance across hops.
- **Collapsible Mesh Protocol Debugger:** Built-in live packet inspector and interactive testbed for simulating multi-hop relays, duplicate attacks, and TTL expiration.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool & Bundler** | Vite |
| **Bluetooth Interface** | Web Bluetooth API (`navigator.bluetooth`) |
| **Type Definitions** | `@types/web-bluetooth` |
| **Peripheral GATT Server** | Android (nRF Connect for Mobile / BLE Peripheral Simulator) |

---

## 📋 Architecture & GATT Profile

```text
[ Laptop Chrome (Central) ] 
       │
       │  Bluetooth Low Energy (GATT Connection)
       ▼
[ Android Phone (Peripheral GATT Server) ]
  ├── Primary Service:                 0000ffe0-0000-1000-8000-00805f9b34fb (0xFFE0)
  ├── Write Characteristic (In):       0000ffe1-0000-1000-8000-00805f9b34fb (0xFFE1)
  └── Notify Characteristic (Out):     0000ffe2-0000-1000-8000-00805f9b34fb (0xFFE2)
```

### Mesh Packet Envelope Structure
```typescript
interface MeshPacket {
  id: string;          // Unique UUID / Hash (prevents duplicate loops)
  origin: string;      // Sender Node ID (e.g., 'my-laptop')
  destination: string; // Target Node ID or '*' for public broadcast
  ttl: number;         // Time-To-Live: decremented on every relay hop
  hopCount: number;    // Relayed hop counter
  timestamp: number;   // Unix epoch timestamp
  payload: string;     // Message payload
}
```

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/vivekyadav-3/web-bluetooth-chat.git
cd web-bluetooth-chat
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in **Google Chrome** (Web Bluetooth requires Chrome, Edge, or a Chromium-based browser with Bluetooth enabled).

---

## 📱 Setting Up the Android Phone Peripheral

To test without hardware microcontrollers, configure a phone to act as the GATT Server:

1. Install **nRF Connect for Mobile** (by Nordic Semiconductor) from Google Play.
2. In the menu (☰), go to **Configure GATT Server**:
   - Add a Service with UUID: `0xFFE0`
   - Add Characteristic 1: UUID `0xFFE1` (Properties: `WRITE`, `WRITE NO RESPONSE`, Permission: `Plain`)
   - Add Characteristic 2: UUID `0xFFE2` (Properties: `NOTIFY`, Descriptor: `0x2902`)
3. Go to the **ADVERTISER** tab:
   - Tap **+** to add an advertiser packet.
   - Check **Connectable** and set **Tx Power Level** to `HIGH` (or `+1 dBm`) for wall penetration.
   - Add Record ➔ **Service UUID**: `0xFFE0`.
   - Toggle the advertiser switch **ON**.
4. In Chrome on your laptop, click **Connect Bluetooth Device**, pair your phone, and start chatting!

---

## ⚠️ Current Scope & Known Limitations

- **Central-Only Browser Constraint:** The W3C Web Bluetooth standard only implements the Central client role. Web browsers cannot currently advertise as BLE peripherals; one endpoint must be a native peripheral or simulator.
- **Physical Multi-Hop Testing:** While the mesh protocol logic (duplicate filter, TTL decrement, hop counting) is verified in code and debugger simulations, real physical relay requires multiple dual-role hardware or native mobile nodes.
- **Encryption:** Messages are currently transmitted as plain UTF-8 text envelopes; end-to-end encryption (e.g., AES-GCM via Web Crypto API) is planned for future milestones.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
