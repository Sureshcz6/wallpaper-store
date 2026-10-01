
import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-5 md:p-6">
        {children}
      </main>
    </div>
  );
}
