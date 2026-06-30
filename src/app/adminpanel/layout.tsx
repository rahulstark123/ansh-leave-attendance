import type { Metadata } from "next";
import { AdminShell } from "@/components/adminpanel/admin-shell";
import "./adminpanel.css";

export const metadata: Metadata = {
  title: "ANSH Admin — Support Desk",
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="adminpanel-root dark">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
