import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MOCK_USERS } from '@/lib/db/mock/users.mock'
import { ROLE_LABELS } from '@/lib/auth/permissions'

export function DemoCredentialsCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Demo credentials</CardTitle>
        <CardDescription>
          Prototype only — every account uses the password{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">demo1234</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {MOCK_USERS.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2"
          >
            <span className="font-mono text-xs text-foreground">{u.email}</span>
            <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}