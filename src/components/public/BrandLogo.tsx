import logo from "@/assets/used-mobile-logo.png";

export function BrandLogo({ className }: { className?: string } = {}) {
  return (
    <img
      src={logo}
      onError={(e) => {
        // Fallback to static public root asset if bundled URL fails
        if (e.currentTarget.src !== "/used-mobile-logo.png") {
          e.currentTarget.src = "/used-mobile-logo.png";
        }
      }}
      alt="USED MOBILES"
      width={64}
      height={64}
      loading="eager"
      decoding="async"
      className={className ?? "h-14 md:h-16 w-auto max-w-[85%] object-contain shrink-0"}
    />
  );
}
