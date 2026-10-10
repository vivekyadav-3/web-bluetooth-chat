import {
  CHAT_SERVICE_UUID,
  CHAT_WRITE_CHAR_UUID,
  CHAT_NOTIFY_CHAR_UUID,
} from './constants';

class BLEManager {
  private device: BluetoothDevice | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Check if browser supports Web Bluetooth
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // Connect to the BLE peripheral (Phone)
  async connect(
    onMessageReceived: (message: string) => void,
    onDisconnected: () => void
  ): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome.');
    }

    // 1. Request the Bluetooth device
    // Chrome will show a pairing popup to the user
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [CHAT_SERVICE_UUID] }],
    });

    if (!this.device.gatt) {
      throw new Error('Device does not support GATT communication.');
    }

    // Listen for unexpected disconnections (e.g. out of range, turned off)
    this.device.addEventListener('gattserverdisconnected', () => {
      this.cleanup();
      onDisconnected();
    });

    // 2. Connect to the GATT Server
    const server = await this.device.gatt.connect();

    // 3. Get the Primary Chat Service
    const service = await server.getPrimaryService(CHAT_SERVICE_UUID);

    // 4. Get the Write Characteristic (Laptop -> Phone)
    this.writeCharacteristic = await service.getCharacteristic(CHAT_WRITE_CHAR_UUID);

    // 5. Get the Notify Characteristic (Phone -> Laptop)
    this.notifyCharacteristic = await service.getCharacteristic(CHAT_NOTIFY_CHAR_UUID);

    // 6. Subscribe to notifications from the phone
    await this.notifyCharacteristic.startNotifications();
    this.notifyCharacteristic.addEventListener(
      'characteristicvaluechanged',
      (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (target.value) {
          const text = new TextDecoder().decode(target.value);
          onMessageReceived(text);
        }
      }
    );

    return this.device.name || 'Unknown BLE Device';
  }

  // Send text message to the phone
  async sendMessage(text: string): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Not connected to a Bluetooth device.');
    }

    const payload = new TextEncoder().encode(text);
    
    // Write bytes to the phone
       // Write bytes to the phone
    await this.writeCharacteristic.writeValueWithResponse(payload);

  }

  // Disconnect from the device
  disconnect(): void {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.device = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
  }
}

// Export a singleton instance
export const bleManager = new BLEManager();
