import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const PageLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
      <main className="ml-0 bg-background lg:ml-64 pt-16">
        {children}
      </main>
    </div>
  );
};
