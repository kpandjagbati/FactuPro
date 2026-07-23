import AdminNavbar from "@/app/components/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AdminNavbar />
      <div className="mb-10 mt-8 px-5 md:px-[10%]">{children}</div>
    </div>
  );
}
