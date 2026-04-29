
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SignupFormLoader } from '@/components/auth/signup-form-loader';


export default function SignupPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg animate-in fade-in duration-500">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">
              Criar uma conta
            </CardTitle>
            <CardDescription>
              Insira seus dados abaixo para se juntar ao Agendamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupFormLoader />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link
            href="/"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
