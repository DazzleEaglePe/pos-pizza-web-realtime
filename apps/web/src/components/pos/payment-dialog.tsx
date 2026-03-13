"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Banknote } from "lucide-react";
import { useTranslation } from "@/i18n";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirm: (payload: {
    paymentMethod: string;
    cashReceived?: number;
    referenceNumber?: string;
  }) => void;
  isSubmitting: boolean;
}

export function PaymentDialog({
  isOpen,
  onOpenChange,
  totalAmount,
  onConfirm,
  isSubmitting,
}: PaymentDialogProps) {
  const { t } = useTranslation();

  // Payment State
  const [paymentType, setPaymentType] = useState<"CASH" | "DIGITAL">("CASH");
  const [digitalMethod, setDigitalMethod] = useState<"YAPE" | "PLIN" | "CARD">(
    "YAPE",
  );

  // Cash State
  const [cashReceived, setCashReceived] = useState<string>("");

  // Digital State
  const [referenceNumber, setReferenceNumber] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaymentType("CASH");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDigitalMethod("YAPE");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCashReceived("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReferenceNumber("");
    }
  }, [isOpen]);

  const numCashReceived = parseFloat(cashReceived) || 0;
  const changeAmount = numCashReceived - totalAmount;
  const isCashValid = numCashReceived >= totalAmount;

  const isDigitalValid = referenceNumber.trim().length > 0;

  const quickAmounts = [10, 20, 50, 100, Math.ceil(totalAmount)];

  const handleSubmit = () => {
    if (paymentType === "CASH" && !isCashValid) return;
    if (paymentType === "DIGITAL" && !isDigitalValid) return;

    onConfirm({
      paymentMethod: paymentType === "CASH" ? "CASH" : digitalMethod,
      cashReceived: paymentType === "CASH" ? numCashReceived : undefined,
      referenceNumber: paymentType === "DIGITAL" ? referenceNumber : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#1c1c1c] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>{t("payment.title")}</span>
            <span className="text-primary text-2xl font-black">
              S/ {totalAmount.toFixed(2)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={paymentType}
          onValueChange={(val) =>
            setPaymentType(val === "DIGITAL" ? "DIGITAL" : "CASH")
          }
          className="w-full mt-4"
        >
          <TabsList className="grid w-full grid-cols-2 bg-[#252525]">
            <TabsTrigger
              value="CASH"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-wider"
            >
              <Banknote className="w-4 h-4 mr-2" /> {t("payment.cashTab")}
            </TabsTrigger>
            <TabsTrigger
              value="DIGITAL"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-wider"
            >
              <Smartphone className="w-4 h-4 mr-2" /> {t("payment.digitalTab")}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* CASH TAB */}
            {paymentType === "CASH" && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">
                    {t("payment.cashReceived")}
                  </label>
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
                      {idx === quickAmounts.length - 1
                        ? t("payment.exact")
                        : `S/ ${amt}`}
                    </Button>
                  ))}
                </div>

                <div
                  className={`p-4 rounded-xl flex justify-between items-center ${isCashValid ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"} border`}
                >
                  <span className="font-semibold text-sm">
                    {t("payment.change")}:{" "}
                  </span>
                  <span
                    className={`text-xl font-black ${isCashValid ? "text-primary" : "text-red-400"}`}
                  >
                    {isCashValid
                      ? `S/ ${changeAmount.toFixed(2)}`
                      : t("payment.missingMoney")}
                  </span>
                </div>
              </div>
            )}

            {/* DIGITAL TAB */}
            {paymentType === "DIGITAL" && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button
                    variant={digitalMethod === "YAPE" ? "default" : "outline"}
                    onClick={() => setDigitalMethod("YAPE")}
                    className={
                      digitalMethod === "YAPE"
                        ? "bg-[#74005e] hover:bg-[#5a0048]"
                        : "border-white/10 bg-[#252525]"
                    }
                  >
                    {t("payment.yape")}
                  </Button>
                  <Button
                    variant={digitalMethod === "PLIN" ? "default" : "outline"}
                    onClick={() => setDigitalMethod("PLIN")}
                    className={
                      digitalMethod === "PLIN"
                        ? "bg-[#0038A6] hover:bg-[#002B80]"
                        : "border-white/10 bg-[#252525]"
                    }
                  >
                    {t("payment.plin")}
                  </Button>
                  <Button
                    variant={digitalMethod === "CARD" ? "default" : "outline"}
                    onClick={() => setDigitalMethod("CARD")}
                    className={
                      digitalMethod === "CARD"
                        ? "bg-primary/20 text-primary border border-primary/50"
                        : "border-white/10 bg-[#252525]"
                    }
                  >
                    {t("payment.card")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">
                    {t("payment.referenceLabel")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("payment.referencePlaceholder")}
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="h-12 font-medium bg-[#252525] border-white/10 uppercase"
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-500">
                    {t("payment.referenceHint")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Tabs>

        <div className="pt-4 mt-2 border-t border-white/5">
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (paymentType === "CASH" ? !isCashValid : !isDigitalValid)
            }
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm"
          >
            {isSubmitting
              ? t("payment.processing")
              : t("payment.confirmAndPrint")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
