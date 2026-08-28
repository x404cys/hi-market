import type { OrderStatus } from "@/app/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabels, orderStatusTone } from "@/lib/orders/order-format";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(orderStatusTone[status], className)}>
      {orderStatusLabels[status]}
    </Badge>
  );
}
