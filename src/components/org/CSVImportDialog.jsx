/**
 * Dialog para importar estructura organizacional desde CSV
 */

import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button, Alert, Card } from '../ui';

const CSVImportDialog = ({ isOpen, onClose, onImport }) => {
  const [csvData, setCsvData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Template CSV para descargar
  const csvTemplate = `name,description,level,parentId,managerId,managerType
Ventas,Área de ventas y comercial,2,,,
Marketing,Área de marketing y comunicación,2,,,
IT,Área de tecnología,2,,,
Ventas Nacionales,Departamento de ventas nacionales,3,Ventas,,functional
Ventas Internacionales,Departamento de ventas internacionales,3,Ventas,,functional
Marketing Digital,Departamento de marketing digital,3,Marketing,,functional
Desarrollo,Departamento de desarrollo de software,3,IT,,functional`;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV válido');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Validar headers requeridos
        const requiredHeaders = ['name', 'level'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setError(`Headers requeridos faltantes: ${missingHeaders.join(', ')}`);
          return;
        }
        
        // Parsear datos
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          const row = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || null;
          });
          
          // Convertir tipos
          if (row.level) {
            row.level = parseInt(row.level);
          }
          
          data.push(row);
        }
        
        setCsvData(data);
        setError(null);
        validateData(data);
      } catch (err) {
        setError('Error al procesar el archivo CSV: ' + err.message);
      }
    };
    
    reader.readAsText(file);
  };
  
  const validateData = (data) => {
    const results = {
      valid: [],
      invalid: [],
      total: data.length
    };
    
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 porque CSV tiene header y es 0-indexed
      const errors = [];
      
      // Validar nombre
      if (!row.name || row.name.length < 2) {
        errors.push('Nombre debe tener al menos 2 caracteres');
      }
      
      // Validar nivel
      if (!row.level || row.level < 1 || row.level > 3) {
        errors.push('Nivel debe estar entre 1 y 3');
      }
      
      // Validar manager type
      if (row.managerType && !['functional', 'project', 'matrix'].includes(row.managerType)) {
        errors.push('Tipo de manager debe ser: functional, project, o matrix');
      }
      
      if (errors.length === 0) {
        results.valid.push({ row: rowNum, data: row });
      } else {
        results.invalid.push({ row: rowNum, data: row, errors });
      }
    });
    
    setValidationResults(results);
  };
  
  const handleImport = async () => {
    if (!csvData || !validationResults) return;
    
    setLoading(true);
    try {
      await onImport(validationResults.valid.map(v => v.data));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estructura_organizacional_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  const reset = () => {
    setCsvData(null);
    setValidationResults(null);
    setError(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Importar Estructura Organizacional
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Template Download */}
          <Card className="mb-6">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Template CSV
                  </h3>
                  <p className="text-sm text-gray-600">
                    Descarga el template con la estructura requerida
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Template</span>
                </Button>
              </div>
            </div>
          </Card>
          
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo CSV
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Arrastra tu archivo CSV aquí o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Seleccionar archivo
              </label>
            </div>
          </div>
          
          {/* Error */}
          {error && (
            <Alert type="error" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}
          
          {/* Validation Results */}
          {validationResults && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Resultados de Validación
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{validationResults.valid.length} válidos</span>
                  </div>
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationResults.invalid.length} con errores</span>
                  </div>
                </div>
              </div>
              
              {/* Valid Rows */}
              {validationResults.valid.length > 0 && (
                <Card>
                  <div className="p-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      Filas válidas ({validationResults.valid.length})
                    </h4>
                    <div className="space-y-1">
                      {validationResults.valid.slice(0, 5).map(item => (
                        <div key={item.row} className="text-sm text-gray-700">
                          Fila {item.row}: {item.data.name} (Nivel {item.data.level})
                        </div>
                      ))}
                      {validationResults.valid.length > 5 && (
                        <div className="text-sm text-gray-500">
                          ... y {validationResults.valid.length - 5} más
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Invalid Rows */}
              {validationResults.invalid.length > 0 && (
                <Card>
                  <div className="p-4">
                    <h4 className="font-medium text-red-800 mb-2">
                      Filas con errores ({validationResults.invalid.length})
                    </h4>
                    <div className="space-y-2">
                      {validationResults.invalid.slice(0, 5).map(item => (
                        <div key={item.row} className="text-sm">
                          <div className="font-medium text-red-800">
                            Fila {item.row}: {item.data.name || 'Sin nombre'}
                          </div>
                          <div className="text-red-600 ml-2">
                            {item.errors.join(', ')}
                          </div>
                        </div>
                      ))}
                      {validationResults.invalid.length > 5 && (
                        <div className="text-sm text-gray-500">
                          ... y {validationResults.invalid.length - 5} más
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            {csvData && (
              <Button
                variant="outline"
                onClick={reset}
                disabled={loading}
              >
                Limpiar
              </Button>
            )}
            <Button
              onClick={handleImport}
              disabled={!validationResults || validationResults.valid.length === 0 || loading}
            >
              {loading ? 'Importando...' : `Importar ${validationResults?.valid.length || 0} áreas`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImportDialog;
