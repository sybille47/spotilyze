import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card className="glass">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  )
}