import Header from "@/components/common/Header";
import ProtectedRoute from "@/components/providers/protected-route-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Header />
      {children}
    </ProtectedRoute>
  );
}
