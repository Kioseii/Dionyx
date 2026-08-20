import type { ComponentProps } from "react";
import { Sidebar } from "../components/sidebar/Sidebar";

type SidebarProps = ComponentProps<typeof Sidebar>;
type SidebarCopy = SidebarProps["copy"];

type UseSidebarPropsOptions = {
  copy: SidebarCopy;
  sidebarProps: Omit<SidebarProps, "copy">;
};

export function useSidebarProps({
  copy,
  sidebarProps,
}: UseSidebarPropsOptions): SidebarProps {
  return {
    copy,
    ...sidebarProps,
  };
}
