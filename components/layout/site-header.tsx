import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold text-foreground">ArogyaX</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#roles" className="hover:text-foreground">Roles</a>
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Sign in
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}