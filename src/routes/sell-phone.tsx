import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sell-phone")({
  component: () => <Outlet />,
});
