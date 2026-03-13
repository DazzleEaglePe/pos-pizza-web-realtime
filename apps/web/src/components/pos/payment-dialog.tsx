"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Smartphone, CreditCard, Banknote } from "lucide-react";
import { useTranslation } from "@/i18n";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirm: (payload: { paymentMethod: string; cashReceived?: number; referenceNumber?: string }) => void;
  isSubmitting: boolean;
}

export function PaymentDialog({ isOpen, onOpenChange, totalAmount, onConfirm, isSubmitting }: PaymentDialogProps) {
  const { t } = useTranslation();
  
  // Payment State
  const [method, setMethod] = useState<string>("CASH");
  
  // Cash State
  const [cashReceived, setCashReceived] = useState<string>("");
  
  // Digital State
  const [referenceNumber, setReferenceNumber] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setMethod("CASH");
      setCashReceived("");
      setReferenceNumber("");
    }
  }, [isOpen]);

  const numCashReceived = parseFloat(cashReceived) || 0;
  const changeAmount = numCashReceived - totalAmount;
  const isCashValid = numCashReceived >= totalAmount;
  
  const isDigitalValid = referenceNumber.trim().length > 0;

  const quickAmounts = [10, 20, 50, 100, Math.ceil(totalAmount)];

  const handleSubmit = () => {
    if (method === "CASH" && !isCashValid) return;
    if (method !== "CASH" && !isDigitalValid) return;

    onConfirm({
      paymentMethod: method,
      cashReceived: method === "CASH" ? numCashReceived : undefined,
      referenceNumber: method !== "CASH" ? referenceNumber : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#1c1c1c] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Completar Pago</span>
            <span className="text-primary text-2xl font-black">S/ {totalAmount.toFixed(2)}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="CASH" onValueChange={(val) => setMethod(val)} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[#252525]">
            <TabsTrigger value="CASH" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-wider">
              <Banknote className="w-4 h-4 mr-2" /> Efectivo
            </TabsTrigger>
            <TabsTrigger value="DIGITAL" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4 mr-2" /> Digital
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {/* CASH TAB */}
            {method === "CASH" && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">Monto Recibido</label>
                  <Input 
                    type="number" 
                    step="0.10"
                    placeholder="S/ 0.00" 
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="h-14 text-2xl font-black bg-[#252525] border-white/10"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amt, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      onClick={() => setCashReceived(amt.toString())}
                      className="border-white/10 bg-[#252525] hover:bg-white/5 font-bold"
                    >
                      {idx === quickAmounts.length - 1 ? 'Exacto' : `S/ ${amt}`}
                    </Button>
                  ))}
                </div>

                <div className={`p-4 rounded-xl flex justify-between items-center ${isCashValid ? 'bg-primary/10 border-primary/20' : 'bg-red-500/10 border-red-500/20'} border`}>
                  <span className="font-semibold text-sm">Vuelto:</span>
                  <span className={`text-xl font-black ${isCashValid ? 'text-primary' : 'text-red-400'}`}>
                    {isCashValid ? `S/ ${changeAmount.toFixed(2)}` : 'Falta dinero'}
                  </span>
                </div>
              </div>
            )}

            {/* DIGITAL TAB */}
            {method !== "CASH" && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button 
                    variant={method === 'YAPE' ? 'default' : 'outline'} 
                    onClick={() => setMethod('YAPE')}
                    className={method === 'YAPE' ? 'bg-[#74005e] hover:bg-[#5a0048]' : 'border-white/10 bg-[#252525]'}
                  >
                    Yape
                  </Button>
                  <Button 
                    variant={method === 'PLIN' ? 'default' : 'outline'} 
                    onClick={() => setMethod('PLIN')}
                    className={method === 'PLIN' ? 'bg-[#0038A6] hover:bg-[#002B80]' : 'border-white/10 bg-[#252525]'}
                  >
                    Plin
                  </Button>
                  <Button 
                    variant={method === 'CARD' ? 'default' : 'outline'} 
                    onClick={() => setMethod('CARD')}
                    className={method === 'CARD' ? 'bg-primary/20 text-primary border border-primary/50' : 'border-white/10 bg-[#252525]'}
                  >
                    Tarjeta
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">Número de Operación / Referencia</label>
                  <Input 
                    type="text" 
                    placeholder="Ej. 12345678" 
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="h-12 font-medium bg-[#252525] border-white/10 uppercase"
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-500">Obligatorio para conciliar el pago al final del día.</p>
                </div>
              </div>
            )}
          </div>
        </Tabs>

        <div className="pt-4 mt-2 border-t border-white/5">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (method === "CASH" ? !isCashValid : !isDigitalValid)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm"
          >
            {isSubmitting ? "Procesando..." : "Confirmar e Imprimir Ticket"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
