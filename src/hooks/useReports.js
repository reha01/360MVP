// src/hooks/useReports.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import featureFlags from '../lib/featureFlags';

/**
 * useReports - Hook para obtener reportes del usuario
 * TODO: Conectar con reportService real cuando estÃ© implementado
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
            title: 'AutoevaluaciÃ³n Liderazgo',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // hace 2 dÃ­as
            type: 'self', // self, 180, 360
            category: 'leadership',
            url: '/report/report_1',
            pdfAvailable: featureFlags.isPdfEnabled(),
            shareableLink: '/shared/report_1_abcd1234',
            score: 7.8,
            status: 'completed',
            generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            insights: 3, // NÃºmero de insights clave
            recommendations: 5 // NÃºmero de recomendaciones
          },
          {
            id: 'report_2',
            title: 'EvaluaciÃ³n 360Â° ComunicaciÃ³n',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // hace 7 dÃ­as
            type: '360',
            category: 'communication',
            url: '/report/report_2',
            pdfAvailable: featureFlags.isPdfEnabled(),
            shareableLink: '/shared/report_2_efgh5678',
            score: 8.2,
            status: 'completed',
            generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            participants: 5, // NÃºmero de participantes en la evaluaciÃ³n 360
            insights: 4,
            recommendations: 7
          },
          {
            id: 'report_3',
            title: 'EvaluaciÃ³n 180Â° GestiÃ³n de Equipo',
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // hace 14 dÃ­as
            type: '180',
            category: 'teamwork',
            url: '/report/report_3',
            pdfAvailable: featureFlags.isPdfEnabled(),
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
    // TODO: Implementar paginaciÃ³n real
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
