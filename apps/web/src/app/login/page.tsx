import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-card rounded-xl shadow-sm flex items-center justify-center border border-border">
             <span className="text-3xl">🍕</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-foreground">
          POS Pizza
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground font-medium">
          Sign in to access your cashier terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-border">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground font-medium">
          Secure Access • Version 1.0.0
        </p>
      </div>
    </div>
  );
}

