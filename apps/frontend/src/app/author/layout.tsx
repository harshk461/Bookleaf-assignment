import { AuthorLayout } from "@/components/layout/AuthorLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthorLayout>{children}</AuthorLayout>;
}
