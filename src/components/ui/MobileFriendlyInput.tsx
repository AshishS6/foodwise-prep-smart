import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { TOUCH_TARGETS, INPUT_MODES } from "@/constants/mobile";
import { cn } from "@/lib/utils";

interface MobileFriendlyInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'url' | 'search';
  autoComplete?: string;
  error?: string;
}

export const MobileFriendlyInput = React.forwardRef<
  HTMLInputElement,
  MobileFriendlyInputProps
>(({ label, inputMode, autoComplete, error, className, ...props }, ref) => {
  const { isMobile } = useDeviceDetection();

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Input
        ref={ref}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={cn(
          isMobile && "min-h-[44px] text-base",
          error && "border-destructive",
          className
        )}
        style={isMobile ? {
          minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
        } : undefined}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

MobileFriendlyInput.displayName = "MobileFriendlyInput";


