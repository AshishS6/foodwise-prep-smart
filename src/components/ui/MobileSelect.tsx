import * as React from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { TOUCH_TARGETS } from "@/constants/mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MobileSelectOption {
  value: string;
  label: string;
}

interface MobileSelectProps {
  label?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  error,
  className,
}) => {
  const { isMobile } = useDeviceDetection();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  if (isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">{label}</Label>
        )}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between min-h-[44px] text-base",
                error && "border-destructive"
              )}
              style={{
                minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
              }}
            >
              <span className={value ? "" : "text-muted-foreground"}>
                {value ? options.find(opt => opt.value === value)?.label : placeholder}
              </span>
              <span className="text-muted-foreground">▼</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>{label || "Select an option"}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {options.map((option) => (
                <Button
                  key={option.value}
                  variant={value === option.value ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start min-h-[44px] text-base",
                    value === option.value && "bg-primary text-primary-foreground"
                  )}
                  style={{
                    minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
                  }}
                  onClick={() => {
                    onValueChange?.(option.value);
                    setSheetOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(error && "border-destructive")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};


