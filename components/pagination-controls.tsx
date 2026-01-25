'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function PaginationControls({
  page,
  limit,
  total,
  pageSizeOptions = [10, 20, 50, 100],
}: {
  page: number
  limit: number
  total: number
  pageSizeOptions?: number[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(total, page * limit)

  const nextSearchParams = useMemo(() => new URLSearchParams(searchParams), [searchParams])

  const navigate = (updates: { page?: number; limit?: number }) => {
    const sp = new URLSearchParams(nextSearchParams)
    if (updates.page !== undefined) sp.set('page', String(updates.page))
    if (updates.limit !== undefined) sp.set('limit', String(updates.limit))
    router.push(`${pathname}?${sp.toString()}`)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>-
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-muted-foreground">
          Rows:
          <select
            className="ml-2 h-8 rounded-md border bg-background px-2 text-sm"
            value={limit}
            onChange={(e) => navigate({ page: 1, limit: Number(e.target.value) })}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => navigate({ page: page - 1 })}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{page}</span> / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => navigate({ page: page + 1 })}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
