// GATT Service and Characteristic UUIDs
// These must match the configuration in your Android BLE Simulator app.

// Primary Chat Service UUID
export const CHAT_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';

// Characteristic for sending messages from Laptop -> Phone (Writable)
export const CHAT_WRITE_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

// Characteristic for receiving notifications from Phone -> Laptop (Notify)
export const CHAT_NOTIFY_CHAR_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';
