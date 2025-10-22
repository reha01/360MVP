// 360MVP-functions/functions/src/reports/narrativeTemplates.js

/**
 * Sistema de plantillas narrativas modulares para reportes
 * Utiliza placeholders {{variable}} para contenido dinámico
 */

class NarrativeTemplates {
  constructor() {
    this.templates = {
      nivel: this.getNivelTemplates(),
      sombra: this.getSombraTemplates(),
      horizonte: this.getHorizonteTemplates(),
      hojaDeRuta: this.getHojaDeRutaTemplates(),
      introduccion: this.getIntroduccionTemplates(),
      conclusion: this.getConclusionTemplates()
    };
  }

  /**
   * Templates para el bloque NIVEL - describe el punto actual del evaluado
   */
  getNivelTemplates() {
    return {
      inicial: {
        titulo: "Tu Nivel Actual",
        contenido: `{{nombre}}, tu evaluación muestra que te encuentras en un nivel {{nivel}} de desarrollo profesional. 
        Este es un punto {{descripcionNivel}} que indica {{fortalezasPrincipales}}. 
        
        Tu puntuación global de {{scoreGlobal}}% refleja un perfil {{tipoPerfilGeneral}}, con particular 
        fortaleza en las áreas de {{top3Categorias}}. Esto sugiere que has desarrollado competencias 
        {{competenciasDestacadas}} que son valiosas para tu rol actual.`,
        
        variables: ['nombre', 'nivel', 'descripcionNivel', 'fortalezasPrincipales', 
                   'scoreGlobal', 'tipoPerfilGeneral', 'top3Categorias', 'competenciasDestacadas']
      },
      
      intermedio: {
        titulo: "Tu Posición en el Camino",
        contenido: `Con un desempeño del {{scoreGlobal}}%, {{nombre}}, has alcanzado un nivel {{nivel}} 
        que te posiciona {{comparacionBenchmark}}. Tus resultados muestran consistencia en {{areasConsistentes}} 
        y un desarrollo notable en {{areasEnProgreso}}.
        
        Este nivel indica que has consolidado {{habilidadesConsolidadas}} y estás en proceso de 
        fortalecer {{habilidadesEnDesarrollo}}. Tu perfil muestra madurez en {{dimensionMadura}} 
        mientras que {{dimensionEmergente}} presenta oportunidades de crecimiento.`,
        
        variables: ['scoreGlobal', 'nombre', 'nivel', 'comparacionBenchmark', 'areasConsistentes',
                   'areasEnProgreso', 'habilidadesConsolidadas', 'habilidadesEnDesarrollo',
                   'dimensionMadura', 'dimensionEmergente']
      },
      
      avanzado: {
        titulo: "Excelencia en Desarrollo",
        contenido: `{{nombre}}, tu evaluación del {{scoreGlobal}}% te sitúa en un nivel {{nivel}} de excelencia. 
        Este resultado {{comparacionTop}} te distingue particularmente en {{areasExcelencia}}.
        
        Has demostrado dominio en {{competenciasDominio}} y tu perfil refleja {{caracteristicasLiderazgo}}. 
        Tu consistencia en {{dimensionesAltas}} establece un estándar de referencia, mientras que 
        {{oportunidadesRefinamiento}} representan áreas donde incluso la excelencia puede evolucionar.`,
        
        variables: ['nombre', 'scoreGlobal', 'nivel', 'comparacionTop', 'areasExcelencia',
                   'competenciasDominio', 'caracteristicasLiderazgo', 'dimensionesAltas',
                   'oportunidadesRefinamiento']
      }
    };
  }

  /**
   * Templates para el bloque SOMBRA - áreas críticas y riesgos
   */
  getSombraTemplates() {
    return {
      constructivo: {
        titulo: "Áreas de Atención",
        contenido: `Es importante reconocer que toda fortaleza tiene su sombra. En tu caso, {{nombre}}, 
        las áreas que requieren mayor atención son {{areasDebiles}}. Estas dimensiones, con puntuaciones 
        de {{scoresDebiles}}, no representan deficiencias sino oportunidades de equilibrio.
        
        La brecha más significativa se observa en {{brechaPrincipal}}, donde la diferencia entre 
        tu desempeño actual ({{scoreActual}}%) y el esperado ({{scoreEsperado}}%) sugiere 
        {{interpretacionBrecha}}. Atender estas áreas no solo mitigará {{riesgosIdentificados}}, 
        sino que potenciará {{beneficiosEsperados}}.`,
        
        variables: ['nombre', 'areasDebiles', 'scoresDebiles', 'brechaPrincipal', 
                   'scoreActual', 'scoreEsperado', 'interpretacionBrecha', 
                   'riesgosIdentificados', 'beneficiosEsperados']
      },
      
      reflexivo: {
        titulo: "Espacios de Crecimiento",
        contenido: `{{nombre}}, cada perfil profesional tiene zonas de desarrollo natural. Tus resultados 
        revelan que {{dimensionesDesafio}} representan tus principales desafíos actuales, con valores 
        de {{valoresDesafio}} que contrastan con tu desempeño en {{dimensionesFortaleza}}.
        
        Esta asimetría {{interpretacionAsimetria}} puede manifestarse como {{manifestacionesPracticas}}. 
        Sin embargo, es precisamente en estas áreas donde reside tu mayor potencial de crecimiento. 
        La clave está en {{estrategiaClave}} para transformar estas sombras en nuevas fortalezas.`,
        
        variables: ['nombre', 'dimensionesDesafio', 'valoresDesafio', 'dimensionesFortaleza',
                   'interpretacionAsimetria', 'manifestacionesPracticas', 'estrategiaClave']
      }
    };
  }

  /**
   * Templates para el bloque HORIZONTE - visión de crecimiento
   */
  getHorizonteTemplates() {
    return {
      inspirador: {
        titulo: "Tu Horizonte de Desarrollo",
        contenido: `Mirando hacia adelante, {{nombre}}, tu perfil actual te posiciona idealmente para 
        {{oportunidadesFuturas}}. Con un desarrollo sostenido en {{areasClaveDesarrollo}}, podrías 
        alcanzar {{metaAspiracional}} en un plazo de {{plazoEstimado}}.
        
        Tu potencial se ve especialmente prometedor en {{areaPotencialMaximo}}, donde una mejora 
        del {{porcentajeMejora}}% te llevaría a {{resultadoEsperado}}. Este horizonte no es solo 
        alcanzable sino natural dado tu {{fundamentosActuales}} y tu demostrada capacidad en 
        {{capacidadesDemostradas}}.`,
        
        variables: ['nombre', 'oportunidadesFuturas', 'areasClaveDesarrollo', 'metaAspiracional',
                   'plazoEstimado', 'areaPotencialMaximo', 'porcentajeMejora', 'resultadoEsperado',
                   'fundamentosActuales', 'capacidadesDemostradas']
      },
      
      estrategico: {
        titulo: "Visión Estratégica de Crecimiento",
        contenido: `El análisis proyectivo de tu evaluación, {{nombre}}, sugiere tres horizontes de desarrollo: 
        {{horizonteCorto}} (3-6 meses), {{horizonteMedio}} (6-12 meses), y {{horizonteLargo}} (12-24 meses).
        
        Tu trayectoria óptima implica capitalizar {{fortalezasActuales}} mientras desarrollas 
        {{competenciasCriticas}}. El impacto esperado de este desarrollo es {{impactoProyectado}}, 
        posicionándote para {{rolesProyectados}} y habilitándote para {{responsabilidadesFuturas}}.`,
        
        variables: ['nombre', 'horizonteCorto', 'horizonteMedio', 'horizonteLargo',
                   'fortalezasActuales', 'competenciasCriticas', 'impactoProyectado',
                   'rolesProyectados', 'responsabilidadesFuturas']
      }
    };
  }

  /**
   * Templates para HOJA DE RUTA - pasos accionables
   */
  getHojaDeRutaTemplates() {
    return {
      practica: {
        titulo: "Tu Plan de Acción",
        contenido: `{{nombre}}, basándonos en tu evaluación, aquí está tu hoja de ruta personalizada:

        **Primeros 30 días - Fundamentos:**
        • {{accion30_1}}
        • {{accion30_2}}
        • {{accion30_3}}
        
        **Siguientes 60 días - Construcción:**
        • {{accion60_1}}
        • {{accion60_2}}
        • {{accion60_3}}
        
        **Siguientes 90 días - Consolidación:**
        • {{accion90_1}}
        • {{accion90_2}}
        • {{accion90_3}}
        
        Recursos recomendados: {{recursosRecomendados}}
        Métricas de seguimiento: {{metricasSeguimiento}}
        Apoyo sugerido: {{apoyoSugerido}}`,
        
        variables: ['nombre', 'accion30_1', 'accion30_2', 'accion30_3',
                   'accion60_1', 'accion60_2', 'accion60_3',
                   'accion90_1', 'accion90_2', 'accion90_3',
                   'recursosRecomendados', 'metricasSeguimiento', 'apoyoSugerido']
      },
      
      detallada: {
        titulo: "Plan de Desarrollo Integral",
        contenido: `{{nombre}}, tu plan de desarrollo se estructura en las siguientes dimensiones:

        **1. Desarrollo de Competencias Técnicas**
        Foco: {{focoTecnico}}
        Acciones: {{accionesTecnicas}}
        Resultado esperado: {{resultadoTecnico}}
        
        **2. Desarrollo de Habilidades Blandas**
        Foco: {{focoBlandas}}
        Acciones: {{accionesBlandas}}
        Resultado esperado: {{resultadoBlandas}}
        
        **3. Desarrollo de Liderazgo**
        Foco: {{focoLiderazgo}}
        Acciones: {{accionesLiderazgo}}
        Resultado esperado: {{resultadoLiderazgo}}
        
        **Hitos de Evaluación:**
        • {{hito1}} - {{fechaHito1}}
        • {{hito2}} - {{fechaHito2}}
        • {{hito3}} - {{fechaHito3}}
        
        **Sistema de Accountability:**
        {{sistemaAccountability}}`,
        
        variables: ['nombre', 'focoTecnico', 'accionesTecnicas', 'resultadoTecnico',
                   'focoBlandas', 'accionesBlandas', 'resultadoBlandas',
                   'focoLiderazgo', 'accionesLiderazgo', 'resultadoLiderazgo',
                   'hito1', 'fechaHito1', 'hito2', 'fechaHito2', 'hito3', 'fechaHito3',
                   'sistemaAccountability']
      }
    };
  }

  /**
   * Templates para INTRODUCCIÓN
   */
  getIntroduccionTemplates() {
    return {
      estandar: {
        titulo: "Introducción",
        contenido: `{{nombre}}, este informe presenta los resultados de tu evaluación {{tipoEvaluacion}} 
        realizada el {{fechaEvaluacion}}. El análisis abarca {{numDimensiones}} dimensiones clave y 
        {{numPreguntas}} indicadores de desempeño, proporcionando una visión integral de tu perfil profesional.`,
        
        variables: ['nombre', 'tipoEvaluacion', 'fechaEvaluacion', 'numDimensiones', 'numPreguntas']
      }
    };
  }

  /**
   * Templates para CONCLUSIÓN
   */
  getConclusionTemplates() {
    return {
      motivacional: {
        titulo: "Reflexión Final",
        contenido: `{{nombre}}, tu evaluación revela un perfil {{caracteristicaPrincipal}} con 
        un potencial significativo en {{areaPotencial}}. El camino hacia adelante está claramente 
        delineado: {{caminoAdelante}}.
        
        Recuerda que el desarrollo profesional es un viaje continuo. Tus fortalezas en {{fortalezasFinales}} 
        son la base sólida sobre la cual construir. Con dedicación en {{areasEnfoque}}, 
        los próximos {{plazoProyeccion}} pueden marcar una transformación significativa en tu trayectoria profesional.
        
        {{mensajeInspiracional}}`,
        
        variables: ['nombre', 'caracteristicaPrincipal', 'areaPotencial', 'caminoAdelante',
                   'fortalezasFinales', 'areasEnfoque', 'plazoProyeccion', 'mensajeInspiracional']
      }
    };
  }

  /**
   * Genera narrativa completa basada en datos y configuración
   */
  generateNarrative(data, config = {}) {
    const {
      bloques = ['introduccion', 'nivel', 'sombra', 'horizonte', 'hojaDeRuta', 'conclusion'],
      variantes = {},
      plan = 'premium'
    } = config;

    const narrativa = {};

    // Para plan gratuito, solo incluir introducción, nivel y conclusión breve
    const bloquesActivos = plan === 'gratuito' 
      ? ['introduccion', 'nivel', 'conclusion']
      : bloques;

    bloquesActivos.forEach(bloque => {
      if (this.templates[bloque]) {
        const variante = variantes[bloque] || Object.keys(this.templates[bloque])[0];
        const template = this.templates[bloque][variante];
        
        if (template) {
          narrativa[bloque] = {
            titulo: template.titulo,
            contenido: this.replacePlaceholders(template.contenido, data),
            variante
          };
        }
      }
    });

    return narrativa;
  }

  /**
   * Reemplaza placeholders con datos reales
   */
  replacePlaceholders(template, data) {
    let result = template;
    
    // Buscar todos los placeholders {{variable}}
    const placeholders = template.match(/{{(\w+)}}/g) || [];
    
    placeholders.forEach(placeholder => {
      const key = placeholder.replace(/{{|}}/g, '');
      const value = data[key] || `[${key}]`; // Si no hay dato, mostrar el placeholder
      result = result.replace(placeholder, value);
    });
    
    return result;
  }
}

module.exports = NarrativeTemplates;












