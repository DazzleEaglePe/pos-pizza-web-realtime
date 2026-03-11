import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white dark:bg-[#121212] rounded-xl shadow-sm flex items-center justify-center border border-gray-100 dark:border-white/10">
             <span className="text-3xl">🍕</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          POS Pizza
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
          Sign in to access your cashier terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#121212] py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-white/5">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
          Secure Access • Version 1.0.0
        </p>
      </div>
    </div>
  );
}

