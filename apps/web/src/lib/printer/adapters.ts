/**
 * Printer adapter interface and implementations.
 *
 * Two transport layers:
 *  1. WebUSB — direct USB connection via browser WebUSB API
 *  2. Network — send raw bytes to a TCP print server endpoint
 */

export interface PrinterAdapter {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  print(data: Uint8Array): Promise<void>;
  isConnected(): boolean;
}

// ─── WebUSB Adapter ────────────────────────────────────────

export class WebUsbAdapter implements PrinterAdapter {
  readonly name = "USB";
  private device: USBDevice | null = null;
  private endpointNumber = 1;

  async connect(): Promise<void> {
    if (!navigator.usb) {
      throw new Error("WebUSB is not supported in this browser.");
    }

    this.device = await navigator.usb.requestDevice({
      filters: [
        { classCode: 7 }, // Printer class
      ],
    });

    await this.device.open();

    // Select the first configuration if not already selected
    if (this.device.configuration === null) {
      await this.device.selectConfiguration(1);
    }

    // Find the printer interface (class 7)
    const iface = this.device.configuration?.interfaces.find((i) =>
      i.alternates.some((alt) => alt.interfaceClass === 7),
    );

    if (!iface) {
      throw new Error("No printer interface found on USB device.");
    }

    await this.device.claimInterface(iface.interfaceNumber);

    // Find the OUT bulk endpoint
    const alt = iface.alternates.find((a) => a.interfaceClass === 7);
    const outEndpoint = alt?.endpoints.find(
      (ep) => ep.direction === "out" && ep.type === "bulk",
    );

    if (outEndpoint) {
      this.endpointNumber = outEndpoint.endpointNumber;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.close();
      this.device = null;
    }
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.device) {
      throw new Error("USB printer not connected.");
    }
    await this.device.transferOut(this.endpointNumber, data);
  }

  isConnected(): boolean {
    return this.device !== null && this.device.opened;
  }
}

// ─── Network Adapter ───────────────────────────────────────

/**
 * Sends raw ESC/POS data to a network print relay.
 *
 * Expects a simple HTTP endpoint (e.g. a small Node/Python service
 * running on the local network) that forwards the binary payload
 * to the printer via TCP port 9100.
 *
 * Example relay: POST /print  { body: <binary> }
 */
export class NetworkAdapter implements PrinterAdapter {
  readonly name = "Network";
  private endpoint: string;
  private connected = false;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async connect(): Promise<void> {
    // Verify the relay is reachable
    const res = await fetch(this.endpoint, {
      method: "HEAD",
    }).catch(() => null);

    if (!res || !res.ok) {
      throw new Error(`Network printer relay not reachable at ${this.endpoint}`);
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.connected) {
      throw new Error("Network printer not connected.");
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: data,
    });

    if (!res.ok) {
      throw new Error(`Print relay returned ${res.status}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
