import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  // Directly route to the dashboard sub-route for the admin portal
  redirect("/band/admin/dashboard");
}
