const SHEET_NAME = 'Trabajos';
const DEFAULT_HEADERS = ['ID','Doctor','Paciente','Aparato','Tecnico','FechaEntrega','Estado','CreadoEn'];

// ==================== CONFIGURACIÓN ====================
function getConfig() {
  return {
    sheetName: SHEET_NAME,
    headers: DEFAULT_HEADERS,
    statuses: ['Pendiente','Doblado de Alambre','Acrilado','Pulido','En Proceso','Listo'],
    timeZone: Session.getScriptTimeZone()
  };
}

// ==================== INTERFAZ WEB ====================
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BRIODENT-SAS - LMS Laboratorio Ortodoncia')
    .setWidth(1200)
    .setHeight(800);
}

// ==================== INICIALIZACIÓN ====================
/**
 * Asegura que la hoja exista y tenga encabezados correctos.
 * Llamar manualmente si se crea la hoja por primera vez.
 */
function initSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    
    const headers = sheet.getRange(1,1,1,DEFAULT_HEADERS.length).getValues()[0];
    const needInit = headers.join('|') !== DEFAULT_HEADERS.join('|');
    
    if (needInit) {
      sheet.clear();
      sheet.getRange(1,1,1,DEFAULT_HEADERS.length).setValues([DEFAULT_HEADERS]);
      Logger.log('Sheet initialized with headers: ' + DEFAULT_HEADERS.join(', '));
    }
    
    return { success: true, message: 'Sheet initialized successfully' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function _getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Hoja "' + SHEET_NAME + '" no encontrada. Ejecuta initSheet()');
  return sheet;
}

// ==================== OPERACIONES CRUD ====================
/**
 * Obtiene todas las tareas
 */
function getAllTasks() {
  try {
    const sheet = _getSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return [];
    
    const headers = rows[0];
    const data = rows.slice(1).map((r, idx) => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = r[i]);
      obj.rowIndex = idx + 2; // Para referencias de fila
      return obj;
    });
    
    return data;
  } catch (e) {
    Logger.log('Error in getAllTasks: ' + e.message);
    return [];
  }
}

/**
 * Obtiene una tarea por ID
 */
function getTaskById(id) {
  try {
    const tasks = getAllTasks();
    const task = tasks.find(t => String(t.ID) === String(id));
    return task || { success: false, error: 'Tarea no encontrada' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Agrega una nueva tarea
 */
function addTask(task) {
  try {
    const sheet = _getSheet();
    const id = Utilities.getUuid();
    const now = new Date();
    const formattedNow = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    const row = [
      id,
      task.doctor || '',
      task.paciente || '',
      task.aparato || '',
      task.tecnico || '',
      task.fechaEntrega || '',
      task.estado || 'Pendiente',
      formattedNow
    ];
    
    sheet.appendRow(row);
    Logger.log('Task added: ' + id);
    
    return { 
      success: true, 
      id: id,
      message: 'Tarea creada exitosamente'
    };
  } catch (e) {
    Logger.log('Error in addTask: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Actualiza el estado de una tarea
 */
function updateTaskStatus(id, newStatus) {
  try {
    const sheet = _getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('ID');
    const statusCol = headers.indexOf('Estado');
    
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idCol]) === String(id)) {
        sheet.getRange(r + 1, statusCol + 1).setValue(newStatus);
        Logger.log('Task status updated: ' + id + ' -> ' + newStatus);
        return { success: true, message: 'Estado actualizado' };
      }
    }
    
    return { success: false, error: 'ID no encontrado' };
  } catch (e) {
    Logger.log('Error in updateTaskStatus: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Actualiza cualquier campo de una tarea
 */
function updateTaskField(id, fieldName, value) {
  try {
    const sheet = _getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('ID');
    const fieldCol = headers.indexOf(fieldName);
    
    if (fieldCol === -1) return { success: false, error: 'Campo no existe: ' + fieldName };
    
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idCol]) === String(id)) {
        sheet.getRange(r + 1, fieldCol + 1).setValue(value);
        Logger.log('Task field updated: ' + id + ' -> ' + fieldName + ' = ' + value);
        return { success: true, message: 'Campo actualizado' };
      }
    }
    
    return { success: false, error: 'ID no encontrado' };
  } catch (e) {
    Logger.log('Error in updateTaskField: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Elimina una tarea por ID
 */
function deleteTask(id) {
  try {
    const sheet = _getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('ID');
    
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idCol]) === String(id)) {
        sheet.deleteRow(r + 1);
        Logger.log('Task deleted: ' + id);
        return { success: true, message: 'Tarea eliminada' };
      }
    }
    
    return { success: false, error: 'ID no encontrado' };
  } catch (e) {
    Logger.log('Error in deleteTask: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ==================== BÚSQUEDA Y FILTROS ====================
/**
 * Busca tareas por criterios
 */
function searchTasks(criteria) {
  try {
    const tasks = getAllTasks();
    
    return tasks.filter(task => {
      let match = true;
      
      if (criteria.doctor && !task.Doctor.toLowerCase().includes(criteria.doctor.toLowerCase())) match = false;
      if (criteria.paciente && !task.Paciente.toLowerCase().includes(criteria.paciente.toLowerCase())) match = false;
      if (criteria.tecnico && task.Tecnico !== criteria.tecnico) match = false;
      if (criteria.estado && task.Estado !== criteria.estado) match = false;
      if (criteria.aparato && task.Aparato !== criteria.aparato) match = false;
      
      return match;
    });
  } catch (e) {
    Logger.log('Error in searchTasks: ' + e.message);
    return [];
  }
}

/**
 * Obtiene tareas por estado
 */
function getTasksByStatus(status) {
  try {
    return getAllTasks().filter(t => t.Estado === status);
  } catch (e) {
    Logger.log('Error in getTasksByStatus: ' + e.message);
    return [];
  }
}

/**
 * Obtiene tareas asignadas a un técnico
 */
function getTasksByTechnic(technic) {
  try {
    return getAllTasks().filter(t => t.Tecnico === technic);
  } catch (e) {
    Logger.log('Error in getTasksByTechnic: ' + e.message);
    return [];
  }
}

// ==================== REPORTES Y ANÁLISIS ====================
/**
 * Resumen por técnico: cantidad de tareas y días promedio restantes
 */
function getTechSummary() {
  try {
    const tasks = getAllTasks();
    const summary = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    tasks.forEach(t => {
      const tech = t.Tecnico || 'Sin asignar';
      if (!summary[tech]) summary[tech] = { count: 0, totalDays: 0, statuses: {} };
      
      summary[tech].count++;
      
      // Contar por estado
      if (!summary[tech].statuses[t.Estado]) summary[tech].statuses[t.Estado] = 0;
      summary[tech].statuses[t.Estado]++;
      
      let diff = Infinity;
      if (t.FechaEntrega) {
        const due = new Date(t.FechaEntrega + 'T00:00:00');
        diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      }
      summary[tech].totalDays += isFinite(diff) ? diff : 0;
    });
    
    const result = Object.keys(summary).map(k => {
      const s = summary[k];
      return {
        tecnico: k,
        count: s.count,
        avgDays: s.count ? Math.round(s.totalDays / s.count) : null,
        statuses: s.statuses
      };
    });
    
    return result.sort((a, b) => b.count - a.count);
  } catch (e) {
    Logger.log('Error in getTechSummary: ' + e.message);
    return [];
  }
}

/**
 * Resumen por estado
 */
function getStatusSummary() {
  try {
    const tasks = getAllTasks();
    const statuses = getStatuses();
    const summary = {};
    
    statuses.forEach(s => summary[s] = 0);
    tasks.forEach(t => {
      if (summary[t.Estado] !== undefined) summary[t.Estado]++;
    });
    
    return Object.keys(summary).map(status => ({
      estado: status,
      cantidad: summary[status]
    }));
  } catch (e) {
    Logger.log('Error in getStatusSummary: ' + e.message);
    return [];
  }
}

/**
 * Tareas atrasadas
 */
function getOverdueTasks() {
  try {
    const tasks = getAllTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(t => {
      if (!t.FechaEntrega || t.Estado === 'Listo') return false;
      const due = new Date(t.FechaEntrega + 'T00:00:00');
      return due < today;
    });
  } catch (e) {
    Logger.log('Error in getOverdueTasks: ' + e.message);
    return [];
  }
}

/**
 * Tareas por vencer
 */
function getUpcomingTasks(daysAhead = 7) {
  try {
    const tasks = getAllTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + daysAhead);
    
    return tasks.filter(t => {
      if (!t.FechaEntrega || t.Estado === 'Listo') return false;
      const due = new Date(t.FechaEntrega + 'T00:00:00');
      return due >= today && due <= deadline;
    });
  } catch (e) {
    Logger.log('Error in getUpcomingTasks: ' + e.message);
    return [];
  }
}

// ==================== CONFIGURACIÓN ====================
/**
 * Lista de estados configurables
 */
function getStatuses() {
  return ['Pendiente', 'Doblado de Alambre', 'Acrilado', 'Pulido', 'En Proceso', 'Listo'];
}

/**
 * Obtiene lista de técnicos únicos
 */
function getTechnicians() {
  try {
    const tasks = getAllTasks();
    const technicians = new Set();
    tasks.forEach(t => {
      if (t.Tecnico) technicians.add(t.Tecnico);
    });
    return Array.from(technicians).sort();
  } catch (e) {
    Logger.log('Error in getTechnicians: ' + e.message);
    return [];
  }
}

/**
 * Obtiene lista de aparatos únicos
 */
function getApparatuses() {
  try {
    const tasks = getAllTasks();
    const aparatos = new Set();
    tasks.forEach(t => {
      if (t.Aparato) aparatos.add(t.Aparato);
    });
    return Array.from(aparatos).sort();
  } catch (e) {
    Logger.log('Error in getApparatuses: ' + e.message);
    return [];
  }
}

// ==================== EXPORTAR DATOS ====================
/**
 * Exporta todas las tareas como JSON
 */
function exportAsJSON() {
  try {
    const tasks = getAllTasks();
    return {
      exportDate: new Date().toISOString(),
      totalTasks: tasks.length,
      tasks: tasks
    };
  } catch (e) {
    Logger.log('Error in exportAsJSON: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Exporta resumen ejecutivo
 */
function getExecutiveSummary() {
  try {
    const allTasks = getAllTasks();
    const overdue = getOverdueTasks();
    const upcoming = getUpcomingTasks();
    const statusSummary = getStatusSummary();
    const techSummary = getTechSummary();
    
    return {
      exportDate: new Date().toISOString(),
      totalTasks: allTasks.length,
      overdueTasks: overdue.length,
      upcomingTasks: upcoming.length,
      statusSummary: statusSummary,
      technicianSummary: techSummary,
      overdueTasks: overdue,
      upcomingTasks: upcoming
    };
  } catch (e) {
    Logger.log('Error in getExecutiveSummary: ' + e.message);
    return { success: false, error: e.message };
  }
}