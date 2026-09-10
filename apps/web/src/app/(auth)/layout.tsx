export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element -- static public asset, not an optimizable remote image */}
        <img src="/auth-hero.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute left-8 top-8 font-heading text-xl font-bold text-white">
          SheStays
        </span>
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
