"use client";

import { useState } from "react";
import {
  HelpCircle,
  LayoutGrid,
  ShoppingCart,
  CreditCard,
  UtensilsCrossed,
  BarChart3,
  Users,
  ChevronDown,
  ChevronRight,
  Pizza,
  Search,
  Monitor,
  Keyboard,
} from "lucide-react";
import Link from "next/link";

/* ─── FAQ Data ────────────────────────────────────────── */

interface FaqItem {
  q: string;
  a: string;
}

interface HelpSection {
  id: string;
  icon: typeof HelpCircle;
  title: string;
  description: string;
  faqs: FaqItem[];
}

const SECTIONS: HelpSection[] = [
  {
    id: "pos",
    icon: LayoutGrid,
    title: "Punto de Venta (POS)",
    description: "Cómo tomar pedidos, navegar el menú y usar el sistema",
    faqs: [
      {
        q: "¿Cómo crear un nuevo pedido?",
        a: "Ve a Menú en el POS, selecciona los productos deseados. Se agregan automáticamente al carrito lateral. Puedes elegir variantes y modificadores al hacer clic en un producto. Cuando estés listo, presiona 'Pagar' en el carrito.",
      },
      {
        q: "¿Cómo buscar un producto rápidamente?",
        a: "Usa la barra de búsqueda en la parte superior del POS. Puedes buscar por nombre de producto. También puedes filtrar por categoría usando las pestañas.",
      },
      {
        q: "¿Cómo cambiar el tipo de pedido (Salón / Para llevar)?",
        a: "En la parte superior del carrito, verás el selector de tipo de pedido. Haz clic para alternar entre 'Comer aquí' y 'Para llevar'. Si eliges Salón, podrás asignar una mesa.",
      },
      {
        q: "¿Cómo aplicar un combo o promoción?",
        a: "Las promociones activas aparecen en la sección 'Combos' del menú. Haz clic en el combo para agregarlo al carrito con el precio promocional aplicado automáticamente.",
      },
      {
        q: "¿Cómo agregar una nota al pedido?",
        a: "En el carrito, haz clic en el ícono de nota junto a cada producto para agregar instrucciones especiales (ej: 'sin cebolla', 'extra queso').",
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Pagos y Facturación",
    description: "Métodos de pago, cambio y comprobantes",
    faqs: [
      {
        q: "¿Qué métodos de pago están disponibles?",
        a: "El sistema soporta: Efectivo, Tarjeta, Yape, Plin y Pago Mixto (combinación de métodos). Selecciona el método al momento de cobrar.",
      },
      {
        q: "¿Cómo funciona el pago mixto?",
        a: "Al seleccionar 'Mixto', puedes dividir el pago entre varios métodos. Por ejemplo: S/ 30 en efectivo y S/ 20 con Yape. El sistema calcula automáticamente el restante.",
      },
      {
        q: "¿Cómo ver el historial de pagos?",
        a: "Ve a 'Facturas' en el menú lateral del POS. Ahí puedes ver todas las transacciones con filtros por fecha y método de pago.",
      },
      {
        q: "¿Cómo imprimir un comprobante?",
        a: "Después de completar un pago, se genera automáticamente un ticket. Si tienes una impresora configurada, se imprime al instante. También puedes reimprimir desde el historial de pedidos.",
      },
    ],
  },
  {
    id: "tables",
    icon: UtensilsCrossed,
    title: "Gestión de Mesas",
    description: "Mapa de mesas, asignación y estados",
    faqs: [
      {
        q: "¿Cómo ver el estado de las mesas?",
        a: "Ve a 'Mesas' en el menú lateral del POS. Verás un mapa visual con todas las mesas. Verde = disponible, Rojo = ocupada, Amarillo = reservada.",
      },
      {
        q: "¿Cómo asignar una mesa a un pedido?",
        a: "Al crear un pedido tipo 'Comer aquí', puedes seleccionar la mesa desde el selector en el carrito. La mesa cambiará automáticamente a estado 'Ocupada'.",
      },
      {
        q: "¿Las mesas se actualizan en tiempo real?",
        a: "Sí. Cuando otro cajero ocupa o libera una mesa, el cambio se refleja instantáneamente en tu pantalla gracias a la conexión en tiempo real.",
      },
    ],
  },
  {
    id: "kitchen",
    icon: Monitor,
    title: "Pantalla de Cocina",
    description: "Sistema de visualización para cocina (KDS)",
    faqs: [
      {
        q: "¿Cómo acceder a la pantalla de cocina?",
        a: "Navega a /kitchen en el navegador. Es una vista independiente con 3 columnas: Nuevos, En Preparación y Listos. Se recomienda usar una tablet o monitor dedicado.",
      },
      {
        q: "¿Cómo avanzar un pedido en cocina?",
        a: "Haz clic en el botón de estado en cada tarjeta de pedido. El flujo es: Recibido → En Preparación → En Horno → Listo. Cada cambio notifica al cajero en tiempo real.",
      },
      {
        q: "¿La cocina emite sonidos al recibir pedidos?",
        a: "Sí. Cada vez que llega un pedido nuevo se reproduce una alerta sonora y el título de la pestaña parpadea. Puedes silenciar el sonido con el botón de altavoz en la cabecera.",
      },
    ],
  },
  {
    id: "cash-register",
    icon: ShoppingCart,
    title: "Caja Registradora",
    description: "Apertura, cierre y cuadre de caja",
    faqs: [
      {
        q: "¿Cómo abrir caja?",
        a: "Al ingresar al POS, si no hay caja abierta aparecerá automáticamente el formulario. Ingresa el monto inicial en efectivo y confirma. No se pueden crear pedidos sin caja abierta.",
      },
      {
        q: "¿Cómo cerrar caja?",
        a: "Haz clic en el indicador de caja en la barra superior. Ingresa el monto físico de efectivo que tienes. El sistema comparará con el esperado y mostrará la diferencia.",
      },
      {
        q: "¿Dónde veo el historial de cajas?",
        a: "En Admin → Reportes → Caja. Ahí puedes ver todas las sesiones pasadas con desglose por método de pago, monto esperado vs real, y diferencia.",
      },
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "Reportes",
    description: "Ventas, cancelaciones y exportación",
    faqs: [
      {
        q: "¿Qué reportes están disponibles?",
        a: "Ventas (con gráficos de línea, torta por método de pago, barras por categoría), Top Productos, Anulaciones, e Historial de Caja. Todos con filtro por rango de fechas.",
      },
      {
        q: "¿Puedo exportar los reportes?",
        a: "Sí. Cada reporte tiene botones de 'Descargar PDF' y 'Descargar Excel'. El PDF incluye gráficos y tablas, el Excel tiene múltiples hojas con datos detallados.",
      },
    ],
  },
  {
    id: "admin",
    icon: Users,
    title: "Administración",
    description: "Usuarios, catálogo, inventario y configuración",
    faqs: [
      {
        q: "¿Cómo crear un nuevo usuario?",
        a: "Ve a Admin → Equipo → Usuarios. Haz clic en 'Nuevo Usuario'. Ingresa nombre, correo, contraseña y asigna un rol: Admin, Cajero o Cocina.",
      },
      {
        q: "¿Qué roles existen?",
        a: "Admin: acceso total. Cajero: POS + pedidos + cobros. Cocina: solo pantalla de cocina. Los permisos se aplican automáticamente al iniciar sesión.",
      },
      {
        q: "¿Cómo agregar un producto al menú?",
        a: "Ve a Admin → Catálogo → Menú. Haz clic en 'Nuevo Producto'. Completa nombre, precio, categoría e imagen. Puedes agregar variantes (tamaños) y modificadores (extras).",
      },
      {
        q: "¿Cómo gestionar el inventario?",
        a: "Admin → Stock → Insumos para ver items. Reposición para hacer entradas. Recetas para vincular insumos a productos. El sistema descuenta automáticamente al vender y alerta cuando hay stock bajo.",
      },
    ],
  },
  {
    id: "shortcuts",
    icon: Keyboard,
    title: "Atajos de Teclado",
    description: "Accesos rápidos para mayor productividad",
    faqs: [
      {
        q: "¿Qué atajos existen?",
        a: "⌘K / Ctrl+K: Abrir paleta de comandos para navegar rápidamente a cualquier sección. Funciona tanto en el panel de administración como en el POS.",
      },
    ],
  },
];

/* ─── Components ──────────────────────────────────────── */

function FaqAccordion({ faq }: { faq: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3 group"
      >
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {faq.q}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <p className="text-sm text-muted-foreground pb-4 leading-relaxed">
          {faq.a}
        </p>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const normalizedSearch = search.toLowerCase().trim();

  const filteredSections = SECTIONS.map((sec) => ({
    ...sec,
    faqs: normalizedSearch
      ? sec.faqs.filter(
          (f) =>
            f.q.toLowerCase().includes(normalizedSearch) ||
            f.a.toLowerCase().includes(normalizedSearch),
        )
      : sec.faqs,
  })).filter((sec) => sec.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Pizza className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Centro de Ayuda
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            Encuentra respuestas rápidas sobre cómo usar el sistema POS Pizza
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en la ayuda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Section cards grid */}
        {!activeSection && !normalizedSearch && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className="flex flex-col items-start gap-3 p-5 rounded-sm border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                  <sec.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sec.description}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {sec.faqs.length} preguntas
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Active section or search results */}
        {(activeSection || normalizedSearch) && (
          <div>
            {activeSection && !normalizedSearch && (
              <button
                onClick={() => setActiveSection(null)}
                className="text-sm text-primary hover:underline mb-6 font-medium"
              >
                ← Volver a todas las secciones
              </button>
            )}

            {filteredSections.map((sec) => {
              if (activeSection && sec.id !== activeSection && !normalizedSearch)
                return null;
              return (
                <div key={sec.id} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center">
                      <sec.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="font-bold text-lg text-foreground">
                      {sec.title}
                    </h2>
                  </div>
                  <div className="bg-card border border-border rounded-sm divide-y divide-border px-5">
                    {sec.faqs.map((faq, i) => (
                      <FaqAccordion key={i} faq={faq} />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="text-center py-16">
                <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron resultados para &quot;{search}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer link */}
        <div className="text-center pt-6 border-t border-border mt-10">
          <p className="text-xs text-muted-foreground">
            ¿No encuentras lo que buscas? Contacta al administrador del sistema.
          </p>
          <Link
            href="/pos"
            className="inline-block mt-3 text-sm text-primary hover:underline font-medium"
          >
            Volver al POS →
          </Link>
        </div>
      </div>
    </div>
  );
}
