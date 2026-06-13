import { Bell, Search, User } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function DashboardHeader() {
  const notificationsFeatureEnabled = false;

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search books, members, or ISBN..."
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/*
            Reserved for the future in-app notifications tray.
            Do not delete this button concept permanently; it will be reused later.
          */}
          {notificationsFeatureEnabled && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-[#6C5CE7] text-white">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">Admin User</div>
              <div className="text-gray-500">Librarian</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
