import { UtensilsCrossed } from "lucide-react";

export default function AdminMenuPage() {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <UtensilsCrossed className="w-6 h-6 text-primary" />
        Gestión de Menú
      </h1>
      <p className="text-sm text-muted-foreground">
        Próximo paso: CRUD de categorías, productos y variantes.
      </p>
    </div>
  );
}
