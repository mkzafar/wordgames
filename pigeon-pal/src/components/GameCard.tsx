import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  className?: string;
}
export const GameCard = ({
  title,
  description,
  icon,
  onClick,
  className
}: GameCardProps) => {
  return <Card className={cn("card-gradient border-border/20 hover:border-primary/30 transition-all duration-300 hover:scale-105 cursor-pointer group", "shadow-lg hover:shadow-xl glow-effect", className)}>
      <CardHeader className="text-center pb-2 bg-slate-100">
        <div className="text-4xl mb-2 group-hover:animate-pulse-slow">{icon}</div>
        <CardTitle className="text-xl font-bold text-gray-950">{title}</CardTitle>
        <CardDescription className="text-gray-700">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 bg-slate-100">
        <Button variant="game" className="w-full h-12 text-base" onClick={onClick}>
          Open Solver
        </Button>
      </CardContent>
    </Card>;
};