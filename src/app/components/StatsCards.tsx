import { BookOpen, Users, BookMarked, TrendingUp } from "lucide-react";
import { Card } from "./ui/card";

const stats = [
  {
    title: "Total Books",
    value: "12,458",
    change: "+234 this month",
    icon: BookOpen,
    color: "bg-blue-500",
  },
  {
    title: "Active Members",
    value: "3,847",
    change: "+89 new members",
    icon: Users,
    color: "bg-green-500",
  },
  {
    title: "Books Issued",
    value: "1,234",
    change: "Currently borrowed",
    icon: BookMarked,
    color: "bg-orange-500",
  },
  {
    title: "Overdue Books",
    value: "47",
    change: "Requires attention",
    icon: TrendingUp,
    color: "bg-red-500",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <h3 className="mt-2">{stat.value}</h3>
                <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
