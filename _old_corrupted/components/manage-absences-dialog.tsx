import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-in fade-in duration-500">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Agendamento</CardTitle>
            <CardDescription>
              Bem-vindo de volta! Faça login em sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Inscreva-se
          </Link>
        </p>
      </div>
    </main>
  );
}
