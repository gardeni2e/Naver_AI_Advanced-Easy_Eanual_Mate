import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="ambient-shell min-h-screen px-4 pb-12 text-ink sm:px-6 lg:px-8">
      <header className="sticky top-0 z-30 -mx-4 border-b border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-black tracking-normal text-ink sm:text-xl">Easy Manual Mate</p>
            <p className="hidden text-xs font-medium text-muted sm:block">제품 매뉴얼을 쉽게 찾고, 물어보고, 들어보세요</p>
          </div>
          <button type="button" className="btn-secondary h-10 px-3 text-sm" aria-label="도움말">
            <HelpCircle className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">도움말</span>
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
