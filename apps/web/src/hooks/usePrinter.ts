"use client";

import { useState, useCallback } from "react";
import {
  printManager,
  buildTicket,
  buildComanda,
  type PrinterType,
  type TicketData,
  type ComandaData,
} from "@/lib/printer";

export function usePrinter() {
  const [connected, setConnected] = useState(printManager.isConnected());
  const [printerType, setPrinterType] = useState<PrinterType>(
    printManager.getType(),
  );
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const connectUsb = useCallback(async () => {
    try {
      setError(null);
      await printManager.connectUsb();
      setConnected(true);
      setPrinterType("usb");
    } catch (err: any) {
      setError(err?.message ?? "Failed to connect USB printer");
      setConnected(false);
      setPrinterType("none");
    }
  }, []);

  const connectNetwork = useCallback(async (endpoint: string) => {
    try {
      setError(null);
      await printManager.connectNetwork(endpoint);
      setConnected(true);
      setPrinterType("network");
    } catch (err: any) {
      setError(err?.message ?? "Failed to connect network printer");
      setConnected(false);
      setPrinterType("none");
    }
  }, []);

  const disconnect = useCallback(async () => {
    await printManager.disconnect();
    setConnected(false);
    setPrinterType("none");
    setError(null);
  }, []);

  const printTicket = useCallback(
    async (data: TicketData, cols?: number) => {
      try {
        setError(null);
        setPrinting(true);
        const bytes = buildTicket(data, cols);
        await printManager.print(bytes);
      } catch (err: any) {
        setError(err?.message ?? "Print failed");
        throw err;
      } finally {
        setPrinting(false);
      }
    },
    [],
  );

  const printComanda = useCallback(
    async (data: ComandaData, cols?: number) => {
      try {
        setError(null);
        setPrinting(true);
        const bytes = buildComanda(data, cols);
        await printManager.print(bytes);
      } catch (err: any) {
        setError(err?.message ?? "Print failed");
        throw err;
      } finally {
        setPrinting(false);
      }
    },
    [],
  );

  const printRaw = useCallback(async (data: Uint8Array) => {
    try {
      setError(null);
      setPrinting(true);
      await printManager.print(data);
    } catch (err: any) {
      setError(err?.message ?? "Print failed");
      throw err;
    } finally {
      setPrinting(false);
    }
  }, []);

  return {
    connected,
    printerType,
    error,
    printing,
    connectUsb,
    connectNetwork,
    disconnect,
    printTicket,
    printComanda,
    printRaw,
  };
}
