import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-in fade-in duration-500">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">
              Esqueceu a senha?
            </CardTitle>
            <CardDescription>
              Não se preocupe, nós lhe enviaremos as instruções de redefinição.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
        <Link
          href="/"
          className="mt-4 flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
