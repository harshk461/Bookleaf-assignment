import type { BookSale } from "@bookleaf/shared";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { payoutStatusVariant } from "@/components/tickets/badge-variants";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

function formatPayoutStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BookSalesTable({ sales }: { sales: BookSale[] }) {
  if (!sales.length) {
    return <p className="text-sm text-muted-foreground">No sales recorded yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Royalty/Copy</TableHead>
            <TableHead className="text-right">Royalty</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id} className="transition-colors">
              <TableCell>{formatDate(sale.saleDate)}</TableCell>
              <TableCell>{sale.platform ?? "—"}</TableCell>
              <TableCell className="text-right">{sale.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(sale.royaltyPerCopy)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(sale.royaltyAmount)}</TableCell>
              <TableCell>
                <Badge variant={payoutStatusVariant(sale.payoutStatus)}>
                  {formatPayoutStatus(sale.payoutStatus)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
