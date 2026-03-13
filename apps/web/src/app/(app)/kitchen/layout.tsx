import { KitchenShell } from "./kitchen-shell";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KitchenShell>{children}</KitchenShell>;
}
