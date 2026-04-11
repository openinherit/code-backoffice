import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-gray-100 px-6 py-4">
        <span className="text-base font-semibold text-gray-900">
          INHERIT
        </span>
        <span className="ml-1.5 text-sm text-gray-500">Backoffice</span>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <LoginForm />
      </div>
    </div>
  );
}
