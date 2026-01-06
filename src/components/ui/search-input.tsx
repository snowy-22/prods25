'use client';

import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface SearchInputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          className={cn(icon && "pl-10", className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"

export { SearchInput }
