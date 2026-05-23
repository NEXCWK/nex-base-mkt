import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { FirstAccessModal } from "@/components/auth/FirstAccessModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="min-h-screen">{children}</div>
      </main>
      <FirstAccessModal />
    </div>
  );
}
