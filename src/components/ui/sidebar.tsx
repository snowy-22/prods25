

"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useDevice } from "@/hooks/use-device"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "./scroll-area"
import { useLocalStorage } from "@/hooks/use-local-storage"

const SIDEBAR_COOKIE_NAME = "sidebar_state_v2"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH_MOBILE = "22rem"
const SIDEBAR_WIDTH_DEFAULT = 352; // 22rem
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  open: boolean
  setOpen: (open: boolean) => void;
  isMobile: boolean
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
>(
  (
    {
      open,
      onOpenChange,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const deviceInfo = useDevice();
    const isMobile = deviceInfo.type === 'mobile';

    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        onOpenChange(openState);
      },
      [onOpenChange, open]
    );

    const toggleSidebar = React.useCallback(() => {
        setOpen(current => !current);
    }, [setOpen]);


    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])


    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        open,
        setOpen,
        isMobile,
        toggleSidebar,
      }),
      [open, setOpen, isMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={{ ...style } as React.CSSProperties}
            className={cn("group/sidebar-wrapper", className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    isMobile?: boolean;
    mobileOpen?: boolean;
    onMobileOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      side = "left",
      className,
      children,
      style,
      isMobile,
      mobileOpen,
      onMobileOpenChange,
      ...props
    },
    ref
  ) => {
    const { open } = useSidebar();
    const [width, setWidth] = useLocalStorage('secondary-sidebar-width', SIDEBAR_WIDTH_DEFAULT);
    
    if (isMobile) {
      return (
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[var(--sidebar-width)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
        <div
            style={{ width: open ? width : 0 }}
            className={cn(
                "relative group hidden md:flex flex-col text-sidebar-foreground bg-sidebar h-full transition-all duration-300 ease-in-out border-r",
                !open && "border-r-0",
                 className
             )}
             data-state={open ? 'expanded' : 'collapsed'}
        >
          <div className={'min-w-0 w-full h-full overflow-hidden'}>
            {children}
          </div>
        </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn("flex-1 min-h-0 flex flex-col", className)}
      {...props}
    >
        {children}
    </div>
  )
})
SidebarContent.displayName = "SidebarContent"


export {
  Sheet,
  SheetContent,
  Sidebar,
  SidebarContent,
  SidebarProvider,
  useSidebar,
}
