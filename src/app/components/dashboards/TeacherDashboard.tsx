import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BookOpen, ClipboardList, Calendar } from "lucide-react";

export const TeacherDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { title: 'Assigned Subjects', value: '3', icon: BookOpen, color: 'bg-[#6C5CE7]/14 text-[#6C5CE7]' },
    { title: 'Pending Grades', value: '12', icon: ClipboardList, color: 'bg-orange-100 text-orange-600' },
    { title: 'Reservations', value: '1', icon: Calendar, color: 'bg-purple-100 text-purple-600' }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>

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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button onClick={() => navigate('/subjects')} variant="outline" className="justify-start">
            Register Grades
          </Button>
          <Button onClick={() => navigate('/subjects')} variant="outline" className="justify-start">
            View Students
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Computer Science 101', students: 45, pending: 5 },
              { name: 'Data Structures 202', students: 38, pending: 7 },
              { name: 'Algorithms 301', students: 30, pending: 0 }
            ].map((subject) => (
              <div key={subject.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">{subject.name}</p>
                  <p className="text-sm text-gray-500">{subject.students} students · {subject.pending} pending grades</p>
                </div>
                <Button size="sm" onClick={() => navigate('/subjects/1')}>
                  Manage
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
