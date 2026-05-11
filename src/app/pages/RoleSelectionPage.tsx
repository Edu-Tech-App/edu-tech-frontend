import { useNavigate } from "react-router";
import { useAuth, UserRole } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { BookUser, UserCheck, BookOpen, Shield } from "lucide-react";

export const RoleSelectionPage = () => {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const roles: { role: UserRole; icon: any; title: string; description: string; color: string }[] = [
    {
      role: 'student',
      icon: BookUser,
      title: 'Estudiante',
      description: 'Acceda a sus asignaturas, calificaciones y recursos de la biblioteca.',
      color: 'bg-blue-600'
    },
    {
      role: 'teacher',
      icon: UserCheck,
      title: 'Maestro',
      description: 'Gestiona asignaturas, registra calificaciones y consulta la información de los estudiantes.',
      color: 'bg-green-600'
    },
    {
      role: 'librarian',
      icon: BookOpen,
      title: 'Bibliotecario',
      description: 'Gestionar préstamos de libros, devoluciones y recursos de la biblioteca.',
      color: 'bg-purple-600'
    },
    {
      role: 'admin',
      icon: Shield,
      title: 'Administrador',
      description: 'Administrar usuarios, generar informes y configurar el sistema.',
      color: 'bg-red-600'
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    selectRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Selecciona tu Rol</h1>
          <p className="text-gray-600">Elige un rol para acceder al sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.role}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => handleRoleSelect(item.role)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
