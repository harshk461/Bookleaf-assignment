export function BookStatusBadge({ status }: { status: string }) {
  const isProduction = status.toLowerCase().includes("production");
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        isProduction ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {status}
    </span>
  );
}
