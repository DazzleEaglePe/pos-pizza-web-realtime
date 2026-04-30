import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left Panel ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-16">
        {/* Subtle background shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/4" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/4" />
        </div>

        {/* Logo top-left */}
        <div className="absolute top-10 left-10 flex items-center gap-2.5 text-primary-foreground">
          <span className="text-2xl">🍕</span>
          <span className="text-lg font-extrabold tracking-tight">POS Pizza</span>
        </div>

        {/* Floating cards */}
        <div className="relative z-10 w-full max-w-md space-y-4">
          {/* Main card */}
          <div className="bg-white/8 backdrop-blur-sm border border-white/8 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Ventas hoy</p>
                <p className="text-white text-3xl font-black mt-1">S/ 2,480</p>
              </div>
              <div className="text-white/30 text-5xl font-black">📈</div>
            </div>
            <div className="mt-5 flex gap-6">
              <div>
                <p className="text-white/50 text-xs">Pedidos</p>
                <p className="text-white font-bold text-lg">42</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Ticket prom.</p>
                <p className="text-white font-bold text-lg">S/ 59</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">En cocina</p>
                <p className="text-white font-bold text-lg">3</p>
              </div>
            </div>
          </div>

          {/* Small notification */}
          <div className="bg-white/8 backdrop-blur-sm border border-white/8 rounded-2xl px-5 py-4 flex items-center gap-4 max-w-xs">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              ✓
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Pedido listo</p>
              <p className="text-white/50 text-xs">TKT-0042 • Hace 2 min</p>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <h2 className="text-2xl font-black leading-snug">
            Rápido, Simple<br />y en Tiempo Real
          </h2>
          <p className="mt-2 text-sm text-white/60 max-w-sm">
            Gestiona pedidos, controla tu caja y monitorea las ventas desde un solo lugar.
          </p>
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12">
        <div className="w-full max-w-90">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2.5 mb-12 lg:hidden">
            <span className="text-3xl">🍕</span>
            <span className="text-xl font-extrabold tracking-tight text-foreground">POS Pizza</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Accede a tu terminal de punto de venta
          </p>

          {/* Form */}
          <div className="mt-8">
            <LoginForm />
          </div>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            Acceso Seguro &bull; v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
