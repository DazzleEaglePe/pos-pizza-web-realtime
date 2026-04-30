"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  value: string;
  onValueChange: (v: string) => void;
  onSave: () => void;
}

export function NoteDialog({
  open,
  onOpenChange,
  itemName,
  value,
  onValueChange,
  onSave,
}: NoteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-sm border border-border bg-sidebar p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-[15px] font-bold text-foreground">
            {t("cart.itemNoteTitle")}
          </DialogTitle>
          {itemName && (
            <p className="text-[13px] text-muted-foreground mt-0.5">{itemName}</p>
          )}
        </DialogHeader>

        <div className="px-5 py-4">
          <Input
            autoFocus
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
            placeholder={t("cart.itemNotePlaceholder")}
            className="h-10 rounded-sm bg-background/60 border-border text-sm"
          />
        </div>

        <DialogFooter className="px-5 pb-5 pt-0 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-md text-sm"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            className="flex-1 h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
            onClick={onSave}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
