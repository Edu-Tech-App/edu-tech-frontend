import { 
  BookOpen, 
  Users, 
  BookMarked, 
  BarChart3, 
  Settings, 
  Home,
  Plus,
  FileText,
  Calendar
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

const navigation = [
  { name: "Dashboard", icon: Home, current: true },
  { name: "Books", icon: BookOpen, current: false },
  { name: "Members", icon: Users, current: false },
  { name: "Issue/Return", icon: BookMarked, current: false },
  { name: "Reports", icon: BarChart3, current: false },
  { name: "Reservations", icon: Calendar, current: false },
  { name: "Transactions", icon: FileText, current: false },
  { name: "Settings", icon: Settings, current: false },
];

export function LibrarySidebar() {
  return (
    <div className="w-64 bg-[linear-gradient(180deg,#6C5CE7_0%,#5B4BD6_100%)] text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="w-8 h-8 text-[#b6adff]" />
          <div>
            <h2 className="text-white">LibraryMS</h2>
            <p className="text-xs text-white/72">Management System</p>
          </div>
        </div>
      </div>

      <Button className="mb-6 bg-[#6C5CE7] hover:bg-[#5b4bd1] w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add New Book
      </Button>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                item.current
                  ? "bg-white/14 text-white"
                  : "text-white/88 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/16 mt-4">
        <div className="text-xs text-white/72 px-2">
          <p>© 2025 LibraryMS</p>
          <p className="mt-1">Version 2.4.1</p>
        </div>
      </div>
    </div>
  );
}
