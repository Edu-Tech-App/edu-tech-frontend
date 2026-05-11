import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

const recentActivities = [
  {
    id: 1,
    member: "Sarah Johnson",
    book: "The Great Gatsby",
    action: "Borrowed",
    date: "Nov 9, 2025",
    status: "active",
  },
  {
    id: 2,
    member: "Mike Chen",
    book: "To Kill a Mockingbird",
    action: "Returned",
    date: "Nov 9, 2025",
    status: "completed",
  },
  {
    id: 3,
    member: "Emma Wilson",
    book: "1984",
    action: "Borrowed",
    date: "Nov 8, 2025",
    status: "active",
  },
  {
    id: 4,
    member: "James Brown",
    book: "Pride and Prejudice",
    action: "Overdue",
    date: "Nov 5, 2025",
    status: "overdue",
  },
  {
    id: 5,
    member: "Lisa Davis",
    book: "The Catcher in the Rye",
    action: "Reserved",
    date: "Nov 9, 2025",
    status: "reserved",
  },
];

export function RecentActivity() {
  return (
    <Card className="p-6">
      <h3 className="mb-4">Recent Activity</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Book</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentActivities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>{activity.member}</TableCell>
              <TableCell>{activity.book}</TableCell>
              <TableCell>{activity.action}</TableCell>
              <TableCell className="text-gray-500 text-sm">{activity.date}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    activity.status === "active"
                      ? "default"
                      : activity.status === "completed"
                      ? "secondary"
                      : activity.status === "overdue"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {activity.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
