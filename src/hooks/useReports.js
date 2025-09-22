// src/hooks/useReports.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FeatureFlags } from '../services/featureFlags';

/**
 * useReports - Hook para obtener reportes del usuario
 * TODO: Conectar con reportService real cuando esté implementado
 */
export const useReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        setReports([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // TODO: Reemplazar con llamada real a reportService
        // Simulando delay de red
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock data - representa reportes generados para el usuario
        const mockReports = [
          {
            id: 'report_1',
            title: 'Autoevaluación Liderazgo',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // hace 2 días
            type: 'self', // self, 180, 360
            category: 'leadership',
            url: '/report/report_1',
            pdfAvailable: FeatureFlags.isPdfEnabled(),
            shareableLink: '/shared/report_1_abcd1234',
            score: 7.8,
            status: 'completed',
            generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            insights: 3, // Número de insights clave
            recommendations: 5 // Número de recomendaciones
          },
          {
            id: 'report_2',
            title: 'Evaluación 360° Comunicación',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // hace 7 días
            type: '360',
            category: 'communication',
            url: '/report/report_2',
            pdfAvailable: FeatureFlags.isPdfEnabled(),
            shareableLink: '/shared/report_2_efgh5678',
            score: 8.2,
            status: 'completed',
            generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            participants: 5, // Número de participantes en la evaluación 360
            insights: 4,
            recommendations: 7
          },
          {
            id: 'report_3',
            title: 'Evaluación 180° Gestión de Equipo',
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // hace 14 días
            type: '180',
            category: 'teamwork',
            url: '/report/report_3',
            pdfAvailable: FeatureFlags.isPdfEnabled(),
            shareableLink: '/shared/report_3_ijkl9012',
            score: 7.5,
            status: 'completed',
            generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            participants: 3,
            insights: 2,
            recommendations: 4
          }
        ];

        // En desarrollo, mostrar algunos reportes
        setReports(mockReports.slice(0, 3)); // Mostrar los primeros 3
        
      } catch (err) {
        console.error('[360MVP] useReports: Error fetching reports:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  // Helper function para obtener todos los reportes (para vista completa)
  const getAllReports = () => {
    // TODO: Implementar paginación real
    return reports;
  };

  // Helper function para obtener el total de reportes
  const getTotalCount = () => {
    // TODO: Obtener count real del backend
    return 3; // Mock total
  };

  // Helper function para refrescar reportes
  const refreshReports = () => {
    setLoading(true);
    // Re-trigger the effect
  };

  // Helper function para generar link compartible
  const generateShareableLink = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    return report?.shareableLink || `/shared/${reportId}_${Date.now()}`;
  };

  return {
    items: reports,
    total: getTotalCount(),
    loading,
    error,
    refreshReports,
    getAllReports,
    generateShareableLink
  };
};

export default useReports;
