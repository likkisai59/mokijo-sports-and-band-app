import Link from "next/link";
import { Music } from "lucide-react";
import { cn } from "@/utils/cn";

interface BrandLogoProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  textSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  withLink?: boolean;
  onClick?: () => void;
}

export function BrandLogo({
  className,
  iconSize = "md",
  textSize = "xl",
  withLink = true,
  onClick,
}: BrandLogoProps) {
  const iconClasses = cn(
    "p-1.5 bg-primary rounded-lg text-white flex items-center justify-center shrink-0",
    iconSize === "sm" && "p-1",
    iconSize === "lg" && "p-2"
  );
  
  const musicSize = cn(
    "h-5 w-5",
    iconSize === "sm" && "h-4 w-4",
    iconSize === "lg" && "h-6 w-6"
  );

  const textClasses = cn(
    "font-extrabold tracking-tighter text-text-primary",
    textSize === "sm" && "text-sm",
    textSize === "md" && "text-base",
    textSize === "lg" && "text-lg",
    textSize === "xl" && "text-xl",
    textSize === "2xl" && "text-2xl"
  );

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={iconClasses}>
        <Music className={musicSize} />
      </div>
      <span className={textClasses}>
        Band<span className="text-primary">Connect</span>
      </span>
    </div>
  );

  if (withLink) {
    return (
      <Link href="/" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className="cursor-pointer">
      {content}
    </div>
  );
}
