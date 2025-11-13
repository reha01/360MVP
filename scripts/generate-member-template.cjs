/**
 * scripts/generate-member-template.cjs
 *
 * Utilidad para generar la plantilla Excel de importación de miembros.
 *
 * Ejecutar con:
 *    npx --yes --package xlsx node scripts/generate-member-template.cjs
 */

const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_PATH = path.resolve(__dirname, '..', 'public', 'Plantilla_Miembros.xlsx');

const workbook = XLSX.utils.book_new();

const sampleRows = [
  ['email', 'name', 'lastName', 'role'],
  ['ana.garcia@example.com', 'Ana', 'Garcia', 'employee'],
  ['diego.torres@example.com', 'Diego', 'Torres', 'manager'],
  ['maria.lopez@example.com', 'Maria', 'Lopez', 'admin'],
];

const instructionsRows = [
  ['Instrucciones'],
  [''],
  ['1. Completa las columnas sin modificar los encabezados.'],
  ['2. Usa roles permitidos: employee, manager, admin, hr, guest.'],
  ['3. Guarda el archivo como "CSV (delimitado por comas)" antes de subirlo.'],
  ['4. Evita caracteres especiales que puedan romper el formato CSV.'],
  ['5. Las filas en blanco al final se ignorarán automáticamente.'],
];

const membersSheet = XLSX.utils.aoa_to_sheet(sampleRows);
membersSheet['!cols'] = [
  { wch: 32 },
  { wch: 18 },
  { wch: 18 },
  { wch: 14 },
];
XLSX.utils.book_append_sheet(workbook, membersSheet, 'Miembros');

const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsRows);
instructionsSheet['!cols'] = [{ wch: 72 }];
XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');

XLSX.writeFile(workbook, OUTPUT_PATH, { compression: true });

console.log(`[MemberTemplate] Plantilla generada en: ${OUTPUT_PATH}`);






 *
 * Utilidad para generar la plantilla Excel de importación de miembros.
 *
 * Ejecutar con:
 *    npx --yes --package xlsx node scripts/generate-member-template.cjs
 */

const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_PATH = path.resolve(__dirname, '..', 'public', 'Plantilla_Miembros.xlsx');

const workbook = XLSX.utils.book_new();

const sampleRows = [
  ['email', 'name', 'lastName', 'role'],
  ['ana.garcia@example.com', 'Ana', 'Garcia', 'employee'],
  ['diego.torres@example.com', 'Diego', 'Torres', 'manager'],
  ['maria.lopez@example.com', 'Maria', 'Lopez', 'admin'],
];

const instructionsRows = [
  ['Instrucciones'],
  [''],
  ['1. Completa las columnas sin modificar los encabezados.'],
  ['2. Usa roles permitidos: employee, manager, admin, hr, guest.'],
  ['3. Guarda el archivo como "CSV (delimitado por comas)" antes de subirlo.'],
  ['4. Evita caracteres especiales que puedan romper el formato CSV.'],
  ['5. Las filas en blanco al final se ignorarán automáticamente.'],
];

const membersSheet = XLSX.utils.aoa_to_sheet(sampleRows);
membersSheet['!cols'] = [
  { wch: 32 },
  { wch: 18 },
  { wch: 18 },
  { wch: 14 },
];
XLSX.utils.book_append_sheet(workbook, membersSheet, 'Miembros');

const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsRows);
instructionsSheet['!cols'] = [{ wch: 72 }];
XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');

XLSX.writeFile(workbook, OUTPUT_PATH, { compression: true });

console.log(`[MemberTemplate] Plantilla generada en: ${OUTPUT_PATH}`);









