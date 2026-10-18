import logo from '@/assets/used-mobile-logo.png.asset.json';
export function BrandLogo() {
  return <img src={logo.url} alt="USED MOBILES" className="h-14 md:h-16 w-auto max-w-[85%] object-contain shrink-0" />;
}
