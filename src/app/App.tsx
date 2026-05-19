import { RouterProvider } from 'react-router';
import { router } from './routes';
import { api } from "../services/api";

export default function App() {
  return <RouterProvider router={router} />;
}
