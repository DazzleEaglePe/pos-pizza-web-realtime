/**
 * Print Manager — singleton that holds the current adapter and provides
 * high-level print/connect/disconnect methods.
 */

import type { PrinterAdapter } from "./adapters";
import { WebUsbAdapter, NetworkAdapter } from "./adapters";

export type PrinterType = "usb" | "network" | "none";

class PrintManager {
  private adapter: PrinterAdapter | null = null;
  private type: PrinterType = "none";

  getType(): PrinterType {
    return this.type;
  }

  isConnected(): boolean {
    return this.adapter?.isConnected() ?? false;
  }

  async connectUsb(): Promise<void> {
    await this.disconnect();
    const usb = new WebUsbAdapter();
    await usb.connect();
    this.adapter = usb;
    this.type = "usb";
  }

  async connectNetwork(endpoint: string): Promise<void> {
    await this.disconnect();
    const net = new NetworkAdapter(endpoint);
    await net.connect();
    this.adapter = net;
    this.type = "network";
  }

  async disconnect(): Promise<void> {
    if (this.adapter) {
      await this.adapter.disconnect();
      this.adapter = null;
      this.type = "none";
    }
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.adapter || !this.adapter.isConnected()) {
      throw new Error("No printer connected.");
    }
    await this.adapter.print(data);
  }
}

/** Singleton instance */
export const printManager = new PrintManager();
