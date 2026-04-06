"use client";

import Image from "next/image";

/**
 * Sterling Premium logo. Place your JPG at: public/logos/sterling-premium-logo.jpg
 * Use className for size. Renders crisp with premium styling.
 */
export default function SterlingLogo({
  className = "w-16 h-16",
  ...props
}: Omit<React.ComponentProps<typeof Image>, "src" | "alt">) {
  return (
    <Image
      src="/logos/sterling-premium-logo.jpg"
      alt="Sterling"
      width={128}
      height={128}
      className={`object-contain object-center select-none flex-shrink-0 ${className}`}
      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15)) drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
      unoptimized
      priority
      {...props}
    />
  );
}
