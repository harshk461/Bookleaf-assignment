import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, "default" | "secondary" | "outline"> = {
  "Published & Live": "default",
  "In Production": "secondary",
};

export function BookStatusBadge({ status }: { status: string }) {
  return <Badge variant={statusStyles[status] ?? "outline"}>{status}</Badge>;
}
