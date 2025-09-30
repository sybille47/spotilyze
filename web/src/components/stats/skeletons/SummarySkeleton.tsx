import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SummarySkeleton() {
  return (
    <Card className="glass col-span-full">
      <CardHeader>
        <Skeleton className="h-6 w-48 mx-auto" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}