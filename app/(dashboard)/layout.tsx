import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { Sidebar } from "@/components/sidebar/Sidebar";

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
    <div className="flex h-dvh bg-white">
      <Sidebar />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 overflow-y-auto">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
