import Image from "next/image";
import { cn } from "@/lib/utils";

interface VectorLogoProps {
  className?: string;
}

export function VectorLogo({ className }: VectorLogoProps) {
  return (
    <Image
      src="/vector-logo-white.png"
      alt="VECTOR"
      width={4008}
      height={942}
      sizes="180px"
      className={cn("block h-6 w-auto object-contain", className)}
    />
  );
}
