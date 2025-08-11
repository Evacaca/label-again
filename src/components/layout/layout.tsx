import type React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Outlet } from "@tanstack/react-router";
import Cookie from 'js-cookie';
import LabelsProvider from "./context/labels-context";
import { LabelDialog } from "./components/label-dialog";
import { cn } from "@/lib/utils";

interface Props {
  children?: React.ReactNode
}
export function Layout({ children }: Props) {
  const open = Cookie.get('sidebar_state') === "true"
  return (
    <SidebarProvider defaultOpen={open}>
      <LabelsProvider>

        <div className={cn(
          'ml-auto w-full max-w-full',
          'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
          'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
          'sm:transition-[width] sm:duration-200 sm:ease-linear',
          'flex h-svh flex-col',
          'group-data-[scroll-locked=1]/body:h-full',
          'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
        )}>
          <div className=
            'bg-background flex h-16 items-center gap-3 p-4 sm:gap-4'>
            <SidebarTrigger variant='outline' className='scale-125 sm:scale-100' />
          </div>

          {children ? children : <Outlet />}

        </div>
        <AppSidebar />
        <LabelDialog />
      </LabelsProvider>
    </SidebarProvider>
  )
}