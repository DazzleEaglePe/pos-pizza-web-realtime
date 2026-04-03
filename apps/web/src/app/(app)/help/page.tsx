"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink,
  X,
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

/* ─── Animation variants ──────────────────────────────── */

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const } },
};

const gridVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

/* ─── FaqAccordion ────────────────────────────────────── */

function FaqAccordion({ faq }: { faq: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3 group"
      >
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
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

  const activeSec = activeSection
    ? SECTIONS.find((s) => s.id === activeSection)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero header ───────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-5">
            <Pizza className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
            Centro de Ayuda
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8 font-medium">
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
              className="w-full pl-11 pr-10 py-3 bg-card border border-border rounded-3xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-shadow"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Section grid — shown when no active section and no search */}
        <AnimatePresence>
          {!activeSection && !normalizedSearch && (
            <motion.div
              key="section-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              {SECTIONS.map((sec) => (
                <motion.button
                  key={sec.id}
                  variants={cardVariants}
                  onClick={() => setActiveSection(sec.id)}
                  className="flex flex-col items-start gap-3 p-5 rounded-3xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <sec.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {sec.faqs.length} preguntas
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active section view */}
        <AnimatePresence mode="wait">
          {activeSection && !normalizedSearch && activeSec && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.22 } }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            >
              {/* Section header */}
              <div className="flex items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <activeSec.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">
                      {activeSec.title}
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      {activeSec.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection(null)}
                  className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary/10 text-primary border border-primary/15 font-black text-xs uppercase tracking-widest hover:bg-primary/15 transition-colors"
                >
                  ← Todas las secciones
                </button>
              </div>

              <button
                onClick={() => setActiveSection(null)}
                className="sm:hidden mb-4 text-sm font-black text-primary hover:underline"
              >
                ← Volver
              </button>

              <div className="bg-card border border-border rounded-3xl px-5 shadow-sm divide-y divide-border">
                {activeSec.faqs.map((faq, i) => (
                  <FaqAccordion key={i} faq={faq} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search results */}
        {normalizedSearch && (
          <motion.div
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredSections.length === 0 ? (
              <div className="text-center py-16">
                <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  No se encontraron resultados para &quot;{search}&quot;
                </p>
              </div>
            ) : (
              filteredSections.map((sec) => (
                <div key={sec.id} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                      <sec.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-black text-lg text-foreground">
                      {sec.title}
                    </h2>
                  </div>
                  <div className="bg-card border border-border rounded-3xl px-5 shadow-sm divide-y divide-border">
                    {sec.faqs.map((faq, i) => (
                      <FaqAccordion key={i} faq={faq} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border mt-10">
          <p className="text-xs text-muted-foreground font-medium">
            ¿No encuentras lo que buscas? Contacta al administrador del sistema.
          </p>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 mt-3 h-10 px-5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-95 transition-opacity"
          >
            Volver al POS <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
