// src/hooks/useAssignedTasks.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useAssignedTasks - Hook para obtener tareas de evaluación 180/360 asignadas
 * TODO: Conectar con Firestore real cuando el backend esté implementado
 */
export const useAssignedTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // TODO: Reemplazar con llamada real a Firestore/API
        // Simulando delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - representa evaluaciones asignadas al usuario actual
        const mockTasks = [
          {
            id: 'task_1',
            subjectName: 'María González',
            subjectEmail: 'maria.gonzalez@company.com',
            role: 'peer', // peer, manager, direct
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde hoy
            status: 'pending', // pending, in_progress, completed
            processName: 'Evaluación Q4 2024',
            evaluationType: '360', // 180, 360
            url: '/evaluation/assigned_task_1',
            assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // hace 3 días
            estimatedTime: '15-20 min'
          },
          {
            id: 'task_2',
            subjectName: 'Carlos Ruiz',
            subjectEmail: 'carlos.ruiz@company.com',
            role: 'direct',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
            status: 'in_progress',
            processName: 'Evaluación Liderazgo',
            evaluationType: '180',
            url: '/evaluation/assigned_task_2',
            assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // hace 5 días
            estimatedTime: '10-15 min',
            progress: 0.4 // 40% completado
          },
          {
            id: 'task_3',
            subjectName: 'Ana Martín',
            subjectEmail: 'ana.martin@company.com',
            role: 'manager',
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días
            status: 'pending',
            processName: 'Evaluación Desarrollo',
            evaluationType: '360',
            url: '/evaluation/assigned_task_3',
            assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // ayer
            estimatedTime: '20-25 min'
          }
        ];

        // En desarrollo, mostrar algunas tareas
        // En producción real, esto vendría de una query a Firestore
        setTasks(mockTasks.slice(0, 2)); // Mostrar solo las primeras 2
        
      } catch (err) {
        console.error('[360MVP] useAssignedTasks: Error fetching tasks:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedTasks();
  }, [user]);

  // Helper function para obtener todas las tareas (para la vista completa)
  const getAllTasks = () => {
    // TODO: Implementar paginación real
    return tasks;
  };

  // Helper function para obtener el total de tareas
  const getTotalCount = () => {
    // TODO: Obtener count real del backend
    return 3; // Mock total
  };

  // Helper function para refrescar las tareas
  const refreshTasks = () => {
    setLoading(true);
    // Re-trigger the effect by updating a dependency
  };

  return {
    items: tasks,
    total: getTotalCount(),
    loading,
    error,
    refreshTasks,
    getAllTasks
  };
};

export default useAssignedTasks;
