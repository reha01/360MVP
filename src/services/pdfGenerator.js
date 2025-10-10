// src/services/pdfGenerator.js

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import reportService from './reportService';

class PDFGenerator {
  constructor() {
    this.doc = null;
    this.pageHeight = 297; // A4 height in mm
    this.pageWidth = 210; // A4 width in mm
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 7;
    this.colors = {
      primary: [52, 152, 219], // #3498db
      secondary: [46, 204, 113], // #2ecc71
      danger: [231, 76, 60], // #e74c3c
      warning: [243, 156, 18], // #f39c12
      dark: [44, 62, 80], // #2c3e50
      gray: [127, 140, 141], // #7f8c8d
      light: [236, 240, 241] // #ecf0f1
    };
  }

  /**
   * Genera un PDF completo del reporte
   */
  async generatePDF(report, options = {}) {
    const {
      includeCharts = true,
      includeNarrative = true,
      includeRecommendations = true,
      fileName = `reporte_${new Date().getTime()}.pdf`
    } = options;

    try {
      // Inicializar documento PDF
      this.doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Configurar fuentes
      this.doc.setFont('helvetica');

      // 1. Portada
      this.generateCover(report);

      // 2. Índice
      this.doc.addPage();
      this.generateTableOfContents(report, { includeCharts, includeNarrative, includeRecommendations });

      // 3. Resumen Ejecutivo
      this.doc.addPage();
      this.generateExecutiveSummary(report);

      // 4. Métricas y Scores
      this.doc.addPage();
      this.generateMetricsSection(report);

      // 5. Gráficos (si se incluyen)
      if (includeCharts) {
        await this.generateChartsSection(report);
      }

      // 6. Narrativa (si se incluye y está disponible)
      if (includeNarrative && report.narrative) {
        this.generateNarrativeSection(report);
      }

      // 7. Recomendaciones (si se incluyen y están disponibles)
      if (includeRecommendations && report.recommendations) {
        this.generateRecommendationsSection(report);
      }

      // 8. Pie de página en todas las páginas
      this.addFooterToAllPages(report);

      // Guardar PDF
      this.doc.save(fileName);

      return {
        success: true,
        fileName
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Genera la portada del reporte
   */
  generateCover(report) {
    const centerX = this.pageWidth / 2;

    // Fondo con color
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, 0, this.pageWidth, 100, 'F');

    // Logo/Icono
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(60);
    this.doc.text('📊', centerX, 40, { align: 'center' });

    // Título
    this.doc.setFontSize(28);
    this.doc.text('REPORTE DE EVALUACIÓN', centerX, 65, { align: 'center' });

    // Tipo de evaluación
    this.doc.setFontSize(18);
    const evaluationType = report.type === '360' ? '360°' : 'INDIVIDUAL';
    this.doc.text(evaluationType, centerX, 80, { align: 'center' });

    // Información del evaluado
    this.doc.setTextColor(...this.colors.dark);
    this.doc.setFontSize(20);
    this.doc.text(report.metadata?.userName || 'Usuario', centerX, 130, { align: 'center' });

    // Score principal
    const level = reportService.getLevel(report.metrics?.globalScore || 0);
    this.doc.setFontSize(48);
    this.doc.setTextColor(...this.getColorRGB(level.color));
    this.doc.text(`${report.metrics?.globalScore || 0}%`, centerX, 160, { align: 'center' });

    // Nivel
    this.doc.setFontSize(24);
    this.doc.text(level.name.toUpperCase(), centerX, 175, { align: 'center' });

    // Fecha
    this.doc.setTextColor(...this.colors.gray);
    this.doc.setFontSize(12);
    const date = reportService.formatDate(report.generatedAt);
    this.doc.text(date, centerX, 250, { align: 'center' });

    // Línea decorativa
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(30, 260, this.pageWidth - 30, 260);
  }

  /**
   * Genera el índice
   */
  generateTableOfContents(report, options) {
    this.currentY = this.margin;

    // Título
    this.addSectionTitle('ÍNDICE');
    this.currentY += 10;

    const toc = [
      { title: '1. Resumen Ejecutivo', page: 3 },
      { title: '2. Métricas y Puntuaciones', page: 4 }
    ];

    let currentPage = 5;

    if (options.includeCharts) {
      toc.push({ title: '3. Visualizaciones', page: currentPage });
      currentPage += 2;
    }

    if (options.includeNarrative && report.narrative) {
      toc.push({ title: '4. Análisis Narrativo', page: currentPage });
      currentPage += Math.ceil(Object.keys(report.narrative).length / 2);
    }

    if (options.includeRecommendations && report.recommendations) {
      toc.push({ title: '5. Plan de Acción', page: currentPage });
    }

    // Renderizar índice
    this.doc.setFontSize(12);
    toc.forEach(item => {
      this.doc.setTextColor(...this.colors.dark);
      this.doc.text(item.title, this.margin, this.currentY);
      
      // Línea punteada
      const textWidth = this.doc.getTextWidth(item.title);
      const dotsStart = this.margin + textWidth + 5;
      const dotsEnd = this.pageWidth - this.margin - 20;
      
      this.doc.setTextColor(...this.colors.gray);
      let dots = '';
      while (this.doc.getTextWidth(dots) < (dotsEnd - dotsStart)) {
        dots += '.';
      }
      this.doc.text(dots, dotsStart, this.currentY);
      
      // Número de página
      this.doc.setTextColor(...this.colors.dark);
      this.doc.text(item.page.toString(), this.pageWidth - this.margin - 10, this.currentY);
      
      this.currentY += this.lineHeight + 2;
    });
  }

  /**
   * Genera el resumen ejecutivo
   */
  generateExecutiveSummary(report) {
    this.currentY = this.margin;
    this.addSectionTitle('RESUMEN EJECUTIVO');

    // Score global
    this.addSubsection('Evaluación Global');
    const level = reportService.getLevel(report.metrics?.globalScore || 0);
    
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.colors.dark);
    
    const summaryText = `La evaluación realizada el ${reportService.formatDate(report.generatedAt)} ` +
      `ha resultado en un score global del ${report.metrics?.globalScore || 0}%, ` +
      `lo que corresponde a un nivel ${level.name}. ` +
      `Este resultado se basa en el análisis de ${Object.keys(report.metrics?.dimensionScores || {}).length} dimensiones ` +
      `y ${report.metrics?.totalResponses || 0} respuestas totales.`;
    
    this.addParagraph(summaryText);

    // Fortalezas principales
    this.addSubsection('Fortalezas Identificadas');
    if (report.metrics?.strengths && report.metrics.strengths.length > 0) {
      report.metrics.strengths.forEach((strength, index) => {
        const text = `${index + 1}. ${reportService.formatDimensionName(strength.dimension)}: ${Math.round(strength.score)}%`;
        this.doc.text(text, this.margin + 5, this.currentY);
        this.currentY += this.lineHeight;
      });
    }

    // Áreas de mejora
    this.addSubsection('Áreas de Oportunidad');
    if (report.metrics?.weaknesses && report.metrics.weaknesses.length > 0) {
      report.metrics.weaknesses.forEach((weakness, index) => {
        const text = `${index + 1}. ${reportService.formatDimensionName(weakness.dimension)}: ${Math.round(weakness.score)}%`;
        this.doc.text(text, this.margin + 5, this.currentY);
        this.currentY += this.lineHeight;
      });
    }

    // Comparación con benchmarks (si está disponible)
    if (report.benchmarks) {
      this.addSubsection('Posicionamiento');
      const comparison = report.benchmarks.globalComparison;
      const vsIndustry = comparison?.vsIndustry || 0;
      const percentile = comparison?.percentile || 50;
      
      const comparisonText = `Tu evaluación se encuentra ${vsIndustry >= 0 ? 'por encima' : 'por debajo'} ` +
        `del promedio de la industria por ${Math.abs(vsIndustry)} puntos. ` +
        `Esto te posiciona en el percentil ${percentile}, ` +
        `lo que significa que superas al ${percentile}% de los profesionales evaluados.`;
      
      this.addParagraph(comparisonText);
    }
  }

  /**
   * Genera la sección de métricas
   */
  generateMetricsSection(report) {
    this.currentY = this.margin;
    this.addSectionTitle('MÉTRICAS Y PUNTUACIONES');

    // Tabla de dimensiones
    this.addSubsection('Análisis por Dimensiones');
    
    if (report.metrics?.dimensionScores) {
      // Headers de tabla
      const tableHeaders = ['Dimensión', 'Puntuación', 'Nivel'];
      const tableData = [];
      
      Object.entries(report.metrics.dimensionScores).forEach(([dimension, data]) => {
        const score = Math.round(data.average || 0);
        const level = this.getScoreLevel(score);
        tableData.push([
          reportService.formatDimensionName(dimension),
          `${score}%`,
          level
        ]);
      });
      
      this.addTable(tableHeaders, tableData);
    }

    // Estadísticas
    if (report.metrics?.statistics) {
      this.addSubsection('Estadísticas Generales');
      const stats = report.metrics.statistics;
      
      const statsData = [
        ['Media', stats.mean?.toFixed(2) || 'N/A'],
        ['Mediana', stats.median?.toString() || 'N/A'],
        ['Moda', stats.mode?.toString() || 'N/A'],
        ['Desviación Estándar', stats.stdDev?.toFixed(2) || 'N/A']
      ];
      
      this.addTable(['Métrica', 'Valor'], statsData, { width: 100 });
    }
  }

  /**
   * Genera la sección de gráficos (placeholder por ahora)
   */
  async generateChartsSection(report) {
    this.doc.addPage();
    this.currentY = this.margin;
    this.addSectionTitle('VISUALIZACIONES');

    // Nota: En una implementación real, aquí se capturarían los gráficos
    // del DOM usando html2canvas y se añadirían al PDF
    
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.colors.gray);
    this.addParagraph(
      'Los gráficos detallados están disponibles en la versión web del reporte. ' +
      'Para una experiencia interactiva completa, acceda al reporte en línea.'
    );

    // Placeholder para gráfico de radar
    this.addSubsection('Perfil de Competencias');
    this.drawSimpleRadarChart(report.metrics?.dimensionScores);

    // Placeholder para gráfico de barras
    if (this.currentY > 200) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
    this.addSubsection('Distribución de Scores');
    this.drawSimpleBarChart(report.metrics?.categoryScores);
  }

  /**
   * Genera la sección narrativa
   */
  generateNarrativeSection(report) {
    if (!report.narrative) return;

    this.doc.addPage();
    this.currentY = this.margin;
    this.addSectionTitle('ANÁLISIS NARRATIVO');

    Object.entries(report.narrative).forEach(([key, section]) => {
      // Verificar si necesitamos nueva página
      if (this.currentY > 240) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.addSubsection(section.titulo);
      
      // Dividir el contenido en párrafos
      const paragraphs = section.contenido.split('\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        this.addParagraph(paragraph);
      });
    });
  }

  /**
   * Genera la sección de recomendaciones
   */
  generateRecommendationsSection(report) {
    if (!report.recommendations) return;

    this.doc.addPage();
    this.currentY = this.margin;
    this.addSectionTitle('PLAN DE ACCIÓN RECOMENDADO');

    const timeframeLabels = {
      immediate: 'Acciones Inmediatas (30 días)',
      shortTerm: 'Corto Plazo (1-3 meses)',
      mediumTerm: 'Mediano Plazo (3-6 meses)',
      longTerm: 'Largo Plazo (6-12 meses)'
    };

    Object.entries(report.recommendations).forEach(([timeframe, actions]) => {
      if (this.currentY > 240) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.addSubsection(timeframeLabels[timeframe] || timeframe);

      if (Array.isArray(actions) && actions.length > 0) {
        actions.forEach((action, index) => {
          const actionText = typeof action === 'string' ? action : action.action;
          this.doc.setFontSize(10);
          this.doc.setTextColor(...this.colors.dark);
          
          // Bullet point
          this.doc.text('•', this.margin + 5, this.currentY);
          
          // Action text (con wrap)
          const lines = this.doc.splitTextToSize(actionText, this.pageWidth - this.margin * 2 - 10);
          lines.forEach((line, lineIndex) => {
            this.doc.text(line, this.margin + 10, this.currentY + (lineIndex * this.lineHeight));
          });
          
          this.currentY += lines.length * this.lineHeight + 3;
          
          // Impact y Effort (si existen)
          if (action.impact && action.effort) {
            this.doc.setFontSize(9);
            this.doc.setTextColor(...this.colors.gray);
            this.doc.text(`Impacto: ${action.impact} | Esfuerzo: ${action.effort}`, 
              this.margin + 10, this.currentY);
            this.currentY += this.lineHeight;
          }
        });
      }
    });
  }

  /**
   * Añade pie de página a todas las páginas
   */
  addFooterToAllPages(report) {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Línea separadora
      this.doc.setDrawColor(...this.colors.light);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Texto del footer
      this.doc.setFontSize(9);
      this.doc.setTextColor(...this.colors.gray);
      
      // Página
      this.doc.text(`Página ${i} de ${pageCount}`, this.pageWidth / 2, this.pageHeight - 8, { align: 'center' });
      
      // Fecha de generación
      this.doc.text(
        `Generado: ${reportService.formatDate(report.generatedAt)}`,
        this.margin,
        this.pageHeight - 8
      );
      
      // Confidencial
      this.doc.text('CONFIDENCIAL', this.pageWidth - this.margin, this.pageHeight - 8, { align: 'right' });
    }
  }

  // Métodos auxiliares

  /**
   * Añade un título de sección
   */
  addSectionTitle(title) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(...this.colors.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    
    // Línea debajo del título
    this.currentY += 2;
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 10;
  }

  /**
   * Añade un subtítulo
   */
  addSubsection(title) {
    if (this.currentY > 250) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
    
    this.doc.setFontSize(13);
    this.doc.setTextColor(...this.colors.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.currentY += this.lineHeight + 2;
  }

  /**
   * Añade un párrafo con wrap automático
   */
  addParagraph(text) {
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.colors.dark);
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin * 2);
    lines.forEach(line => {
      if (this.currentY > 270) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
    
    this.currentY += 5; // Espacio después del párrafo
  }

  /**
   * Añade una tabla
   */
  addTable(headers, data, options = {}) {
    const { width = this.pageWidth - this.margin * 2 } = options;
    const colWidth = width / headers.length;
    
    // Headers
    this.doc.setFillColor(...this.colors.light);
    this.doc.rect(this.margin, this.currentY - 5, width, 8, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.colors.dark);
    this.doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      this.doc.text(header, this.margin + (index * colWidth) + 2, this.currentY);
    });
    
    this.doc.setFont('helvetica', 'normal');
    this.currentY += this.lineHeight + 2;
    
    // Data rows
    data.forEach((row, rowIndex) => {
      if (this.currentY > 270) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      
      // Alternar color de fondo
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, this.currentY - 5, width, 7, 'F');
      }
      
      this.doc.setFontSize(10);
      this.doc.setTextColor(...this.colors.dark);
      
      row.forEach((cell, cellIndex) => {
        this.doc.text(cell.toString(), this.margin + (cellIndex * colWidth) + 2, this.currentY);
      });
      
      this.currentY += this.lineHeight;
    });
    
    this.currentY += 5;
  }

  /**
   * Dibuja un gráfico de radar simple
   */
  drawSimpleRadarChart(dimensionScores) {
    if (!dimensionScores) return;
    
    const centerX = this.pageWidth / 2;
    const centerY = this.currentY + 40;
    const radius = 35;
    
    // Dibujar círculos concéntricos
    this.doc.setDrawColor(...this.colors.light);
    this.doc.setLineWidth(0.3);
    
    for (let i = 1; i <= 5; i++) {
      this.doc.circle(centerX, centerY, (radius * i) / 5);
    }
    
    // Dibujar datos (simplificado)
    const dimensions = Object.entries(dimensionScores).slice(0, 6);
    const angleStep = (Math.PI * 2) / dimensions.length;
    
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(1);
    
    dimensions.forEach(([dimension, data], index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = (data.average || 0) / 100;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;
      
      if (index === 0) {
        this.doc.moveTo(x, y);
      } else {
        this.doc.lineTo(x, y);
      }
      
      // Label
      const labelX = centerX + Math.cos(angle) * (radius + 10);
      const labelY = centerY + Math.sin(angle) * (radius + 10);
      this.doc.setFontSize(8);
      this.doc.text(reportService.formatDimensionName(dimension).substring(0, 10), labelX, labelY, { align: 'center' });
    });
    
    this.doc.closePath();
    this.doc.stroke();
    
    this.currentY = centerY + radius + 20;
  }

  /**
   * Dibuja un gráfico de barras simple
   */
  drawSimpleBarChart(categoryScores) {
    if (!categoryScores) return;
    
    const startX = this.margin;
    const startY = this.currentY;
    const chartWidth = this.pageWidth - this.margin * 2;
    const chartHeight = 40;
    
    const categories = Object.entries(categoryScores).slice(0, 5);
    const barWidth = chartWidth / categories.length;
    
    categories.forEach(([category, data], index) => {
      const score = data.average || 0;
      const barHeight = (score / 100) * chartHeight;
      const x = startX + (index * barWidth) + barWidth * 0.2;
      const y = startY + chartHeight - barHeight;
      
      // Barra
      this.doc.setFillColor(...this.colors.gradient[index % this.colors.gradient.length]);
      this.doc.rect(x, y, barWidth * 0.6, barHeight, 'F');
      
      // Valor
      this.doc.setFontSize(8);
      this.doc.setTextColor(...this.colors.dark);
      this.doc.text(`${Math.round(score)}%`, x + barWidth * 0.3, y - 2, { align: 'center' });
      
      // Label
      this.doc.text(
        reportService.formatDimensionName(category).substring(0, 8),
        x + barWidth * 0.3,
        startY + chartHeight + 5,
        { align: 'center' }
      );
    });
    
    this.currentY = startY + chartHeight + 15;
  }

  /**
   * Obtiene el nivel basado en el score
   */
  getScoreLevel(score) {
    if (score >= 85) return 'Excelente';
    if (score >= 70) return 'Bueno';
    if (score >= 50) return 'Regular';
    return 'Necesita Mejora';
  }

  /**
   * Convierte color hex a RGB
   */
  getColorRGB(hexColor) {
    const colorMap = {
      '#27ae60': this.colors.secondary,
      '#3498db': this.colors.primary,
      '#f39c12': this.colors.warning,
      '#e74c3c': this.colors.danger
    };
    return colorMap[hexColor] || this.colors.dark;
  }

  /**
   * Exporta gráficos del DOM como imágenes
   */
  async captureChartAsImage(elementId) {
    try {
      const element = document.getElementById(elementId);
      if (!element) return null;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  }
}

export default new PDFGenerator();










