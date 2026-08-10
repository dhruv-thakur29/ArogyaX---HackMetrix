import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-md text-center">
        <CardHeader className="items-center">
          <ShieldAlert className="mb-2 h-10 w-10 text-destructive" />
          <CardTitle>Access restricted</CardTitle>
          <CardDescription>
            Your account role doesn&apos;t have permission to view that page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants({ variant: 'default' }))}>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}