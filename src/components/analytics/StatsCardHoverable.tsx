
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClick: () => void;
  bgColor?: string;
  textColor?: string;
  hoverContent?: React.ReactNode;
}

export function StatsCardHoverable({ 
  title, 
  value, 
  subtitle, 
  icon, 
  onClick,
  bgColor = "bg-blue-50/50",
  textColor = "text-blue-700",
  hoverContent
}: StatsCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card 
          className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
          onClick={onClick}
        >
          <CardHeader className={`pb-2 flex flex-row items-center justify-between ${bgColor}`}>
            <CardTitle className={`text-lg font-medium ${textColor}`}>{title}</CardTitle>
            {icon || <ArrowRight className="h-4 w-4" />}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </CardContent>
        </Card>
      </HoverCardTrigger>
      {hoverContent && (
        <HoverCardContent className="w-80 p-4">
          {hoverContent}
        </HoverCardContent>
      )}
    </HoverCard>
  );
}
