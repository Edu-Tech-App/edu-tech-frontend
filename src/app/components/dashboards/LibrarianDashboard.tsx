import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BookMarked, BookX, DollarSign } from "lucide-react";

export const LibrarianDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { title: 'Active Loans', value: '156', icon: BookMarked, color: 'bg-[#6C5CE7]/14 text-[#6C5CE7]' },
    { title: 'Overdue Books', value: '23', icon: BookX, color: 'bg-red-100 text-red-600' },
    { title: 'Total Fines', value: '$450', icon: DollarSign, color: 'bg-yellow-100 text-yellow-600' }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Librarian Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={() => navigate('/library/loans')} variant="outline" className="justify-start">
            Register Loan
          </Button>
          <Button onClick={() => navigate('/library/loans')} variant="outline" className="justify-start">
            Register Return
          </Button>
          <Button onClick={() => navigate('/library')} variant="outline" className="justify-start">
            Manage Books
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'Loan registered', book: 'Introduction to Algorithms', user: 'John Doe', time: '10 min ago' },
              { action: 'Book returned', book: 'Clean Code', user: 'Jane Smith', time: '25 min ago' },
              { action: 'Fine paid', book: 'Design Patterns', user: 'Mike Johnson', time: '1 hour ago' }
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.book} · {activity.user}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
