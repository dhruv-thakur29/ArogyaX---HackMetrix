import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { RegisterForm } from '@/components/auth/register-form'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'
import { DemoCredentialsCard } from '@/components/auth/demo-credentials-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  return (
    <div className="hero-glow flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <span className="font-display text-2xl font-bold tracking-tight text-foreground">ArogyaX</span>
      </Link>

      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Join ArogyaX to access role-based connected healthcare tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <RegisterForm />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">Or continue with</span>
              </div>
            </div>

            <SocialLoginButtons />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>

        <DemoCredentialsCard />
      </div>
    </div>
  )
}