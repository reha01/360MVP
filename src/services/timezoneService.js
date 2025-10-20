/**
 * Servicio de Zona Horaria y DST
 * 
 * Maneja recordatorios en la zona horaria de la organización
 * y cambios de horario (DST)
 */

import { format, parseISO, addDays, subDays, isWithinInterval } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// ========== TIMEZONE CONFIGURATION ==========

export const SUPPORTED_TIMEZONES = {
  'America/Mexico_City': {
    name: 'México Central',
    country: 'MX',
    dst: true,
    dstStart: '2024-04-07', // Primer domingo de abril
    dstEnd: '2024-10-27'    // Último domingo de octubre
  },
  'America/New_York': {
    name: 'Eastern Time',
    country: 'US',
    dst: true,
    dstStart: '2024-03-10',
    dstEnd: '2024-11-03'
  },
  'Europe/Madrid': {
    name: 'Madrid',
    country: 'ES',
    dst: true,
    dstStart: '2024-03-31',
    dstEnd: '2024-10-27'
  },
  'UTC': {
    name: 'UTC',
    country: 'GLOBAL',
    dst: false
  }
};

/**
 * Obtener zona horaria de la organización
 */
export const getOrgTimezone = async (orgId) => {
  try {
    // En implementación real, consultar Firestore
    // const orgDoc = await db.collection('orgs').doc(orgId).get();
    // return orgDoc.data()?.timezone || 'UTC';
    
    // Simular zona horaria
    return 'America/Mexico_City';
  } catch (error) {
    console.error('[TimezoneService] Error getting org timezone:', error);
    return 'UTC';
  }
};

/**
 * Convertir fecha a zona horaria de la organización
 */
export const convertToOrgTimezone = (date, orgTimezone) => {
  try {
    const zonedDate = utcToZonedTime(date, orgTimezone);
    return zonedDate;
  } catch (error) {
    console.error('[TimezoneService] Error converting to org timezone:', error);
    return date;
  }
};

/**
 * Convertir fecha de zona horaria de la organización a UTC
 */
export const convertFromOrgTimezone = (date, orgTimezone) => {
  try {
    const utcDate = zonedTimeToUtc(date, orgTimezone);
    return utcDate;
  } catch (error) {
    console.error('[TimezoneService] Error converting from org timezone:', error);
    return date;
  }
};

/**
 * Verificar si está en período DST
 */
export const isDSTActive = (date, timezone) => {
  const tzConfig = SUPPORTED_TIMEZONES[timezone];
  
  if (!tzConfig || !tzConfig.dst) {
    return false;
  }
  
  const currentYear = date.getFullYear();
  const dstStart = parseISO(`${currentYear}-${tzConfig.dstStart.substring(5)}`);
  const dstEnd = parseISO(`${currentYear}-${tzConfig.dstEnd.substring(5)}`);
  
  return isWithinInterval(date, { start: dstStart, end: dstEnd });
};

/**
 * Calcular próximo recordatorio en zona horaria de la org
 */
export const calculateNextReminder = async (campaignId, orgId, reminderType = 'daily') => {
  try {
    const orgTimezone = await getOrgTimezone(orgId);
    const now = new Date();
    const orgNow = convertToOrgTimezone(now, orgTimezone);
    
    let nextReminder;
    
    switch (reminderType) {
      case 'daily':
        // Próximo recordatorio a las 9:00 AM hora local
        nextReminder = new Date(orgNow);
        nextReminder.setHours(9, 0, 0, 0);
        
        // Si ya pasó las 9:00 AM, programar para mañana
        if (nextReminder <= orgNow) {
          nextReminder = addDays(nextReminder, 1);
        }
        break;
        
      case 'weekly':
        // Próximo recordatorio el lunes a las 9:00 AM
        nextReminder = new Date(orgNow);
        const daysUntilMonday = (8 - nextReminder.getDay()) % 7;
        nextReminder = addDays(nextReminder, daysUntilMonday);
        nextReminder.setHours(9, 0, 0, 0);
        break;
        
      case 'custom':
        // Recordatorio personalizado (ejemplo: cada 3 días)
        nextReminder = addDays(orgNow, 3);
        nextReminder.setHours(9, 0, 0, 0);
        break;
        
      default:
        nextReminder = addDays(orgNow, 1);
        nextReminder.setHours(9, 0, 0, 0);
    }
    
    // Convertir de vuelta a UTC para almacenar
    const utcReminder = convertFromOrgTimezone(nextReminder, orgTimezone);
    
    return {
      reminderTime: utcReminder,
      orgTimezone,
      orgTime: format(nextReminder, 'yyyy-MM-dd HH:mm:ss', { timeZone: orgTimezone }),
      isDST: isDSTActive(nextReminder, orgTimezone)
    };
  } catch (error) {
    console.error('[TimezoneService] Error calculating next reminder:', error);
    throw error;
  }
};

/**
 * Programar recordatorio con manejo de DST
 */
export const scheduleReminder = async (campaignId, orgId, reminderConfig) => {
  try {
    const orgTimezone = await getOrgTimezone(orgId);
    const { reminderTime, message, type } = reminderConfig;
    
    // Convertir tiempo de recordatorio a zona horaria de la org
    const orgReminderTime = convertToOrgTimezone(reminderTime, orgTimezone);
    
    // Verificar si está en período DST
    const isDST = isDSTActive(orgReminderTime, orgTimezone);
    
    // Ajustar mensaje si es necesario
    const adjustedMessage = isDST 
      ? `${message} (Nota: Horario de verano activo en ${SUPPORTED_TIMEZONES[orgTimezone].name})`
      : message;
    
    // Programar recordatorio
    const scheduledReminder = {
      campaignId,
      orgId,
      reminderTime: reminderTime,
      orgTimezone,
      orgTime: format(orgReminderTime, 'yyyy-MM-dd HH:mm:ss'),
      isDST,
      message: adjustedMessage,
      type,
      status: 'scheduled',
      createdAt: new Date()
    };
    
    console.log(`[TimezoneService] Reminder scheduled for ${orgTimezone} at ${scheduledReminder.orgTime}`);
    return scheduledReminder;
  } catch (error) {
    console.error('[TimezoneService] Error scheduling reminder:', error);
    throw error;
  }
};

/**
 * Obtener información de zona horaria para UI
 */
export const getTimezoneInfo = (timezone) => {
  const tzConfig = SUPPORTED_TIMEZONES[timezone];
  
  if (!tzConfig) {
    return {
      name: 'Zona Horaria Desconocida',
      country: 'UNKNOWN',
      dst: false,
      currentTime: new Date().toISOString()
    };
  }
  
  const now = new Date();
  const orgTime = convertToOrgTimezone(now, timezone);
  const isDST = isDSTActive(now, timezone);
  
  return {
    name: tzConfig.name,
    country: tzConfig.country,
    dst: tzConfig.dst,
    isDST,
    currentTime: format(orgTime, 'yyyy-MM-dd HH:mm:ss'),
    offset: getTimezoneOffset(timezone, now)
  };
};

/**
 * Obtener offset de zona horaria
 */
const getTimezoneOffset = (timezone, date) => {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    return offset;
  } catch (error) {
    return 0;
  }
};

/**
 * Validar zona horaria
 */
export const validateTimezone = (timezone) => {
  return Object.keys(SUPPORTED_TIMEZONES).includes(timezone);
};

/**
 * Obtener zonas horarias soportadas
 */
export const getSupportedTimezones = () => {
  return Object.entries(SUPPORTED_TIMEZONES).map(([key, config]) => ({
    value: key,
    label: config.name,
    country: config.country,
    dst: config.dst
  }));
};

export default {
  SUPPORTED_TIMEZONES,
  getOrgTimezone,
  convertToOrgTimezone,
  convertFromOrgTimezone,
  isDSTActive,
  calculateNextReminder,
  scheduleReminder,
  getTimezoneInfo,
  validateTimezone,
  getSupportedTimezones
};
