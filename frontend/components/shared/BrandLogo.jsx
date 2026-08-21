"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Music, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";

export function BrandLogo({
  className,
  variant = "auto", // "auto" | "unified" | "sports" | "band"
  iconSize = "md",
  textSize = "xl",
  withLink = true,
  onClick,
}) {
  const pathname = usePathname() || "/";

  let effectiveVariant = variant;
  if (effectiveVariant === "auto") {
    if (
      pathname.startsWith("/mokijo") ||
      pathname.startsWith("/venues") ||
      pathname.startsWith("/venue") ||
      pathname.startsWith("/trainings") ||
      pathname.startsWith("/scoreboard") ||
      pathname.startsWith("/bookings") ||
      pathname.startsWith("/user-dashboard")
    ) {
      effectiveVariant = "sports";
    } else if (
      pathname.startsWith("/band") ||
      pathname.startsWith("/artists") ||
      pathname.startsWith("/artist")
    ) {
      effectiveVariant = "band";
    } else {
      effectiveVariant = "unified";
    }
  }

  const iconClasses = cn(
    "rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
    iconSize === "sm" && "p-1 h-7 w-7",
    iconSize === "md" && "p-1.5 h-8 w-8",
    iconSize === "lg" && "p-2 h-10 w-10",
    effectiveVariant === "sports"
      ? "bg-emerald-500 text-black shadow-emerald-500/20 shadow-md"
      : effectiveVariant === "band"
      ? "bg-primary text-white shadow-primary/20 shadow-md"
      : "bg-gradient-to-tr from-primary to-emerald-400 text-white shadow-lg"
  );

  const iconGlyphSize = cn(
    iconSize === "sm" && "h-3.5 w-3.5",
    iconSize === "md" && "h-4.5 w-4.5",
    iconSize === "lg" && "h-5 w-5"
  );

  const textClasses = cn(
    "font-black tracking-tight text-text-primary flex items-center gap-1",
    textSize === "sm" && "text-sm",
    textSize === "md" && "text-base",
    textSize === "lg" && "text-lg",
    textSize === "xl" && "text-xl",
    textSize === "2xl" && "text-2xl"
  );

  const renderIcon = () => {
    if (effectiveVariant === "sports") {
      return <Activity className={iconGlyphSize} />;
    }
    if (effectiveVariant === "band") {
      return <Music className={iconGlyphSize} />;
    }
    return <Sparkles className={iconGlyphSize} />;
  };

  const renderText = () => {
    if (effectiveVariant === "sports") {
      return (
        <span className={textClasses}>
          Mokijo <span className="text-emerald-500 font-extrabold text-sm ml-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 uppercase tracking-wider">Sports</span>
        </span>
      );
    }
    if (effectiveVariant === "band") {
      return (
        <span className={textClasses}>
          Band<span className="text-primary font-extrabold">Connect</span>
        </span>
      );
    }
    return (
      <span className={textClasses}>
        MOKIJO <span className="text-xs font-semibold text-text-secondary opacity-75 tracking-normal ml-0.5 hidden sm:inline">Hub</span>
      </span>
    );
  };

  const content = (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      <div className={iconClasses}>{renderIcon()}</div>
      {renderText()}
    </div>
  );

  if (withLink) {
    const targetHref = effectiveVariant === "sports" ? "/mokijo" : effectiveVariant === "band" ? "/band" : "/";
    return (
      <Link href={targetHref} onClick={onClick}>
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

