import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Fuel } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Fuel className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">TotalEnergies FASS</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button asChild variant={isActive('/') ? 'secondary' : 'ghost'} size="sm">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant={isActive('/staff') ? 'secondary' : 'ghost'} size="sm">
              <Link href="/staff">Staff</Link>
            </Button>
            <Button asChild variant={isActive('/admin') ? 'secondary' : 'ghost'} size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
