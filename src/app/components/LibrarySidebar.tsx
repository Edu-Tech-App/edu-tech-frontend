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
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-white">LibraryMS</h2>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
      </div>

      <Button className="mb-6 bg-blue-600 hover:bg-blue-700 w-full">
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
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-800 mt-4">
        <div className="text-xs text-gray-400 px-2">
          <p>© 2025 LibraryMS</p>
          <p className="mt-1">Version 2.4.1</p>
        </div>
      </div>
    </div>
  );
}
