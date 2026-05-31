/**
 * ExportAdapters.js
 * 
 * Adapters for transforming internal assessment payloads into the exact
 * schemas required by external systems (ASD and CFCR).
 */

export class ExportAdapters {

  /**
   * Prepares a payload for the Assessment Scoring Database (ASD)
   */
  static formatForASD(clientId, caregiverId, assessmentId, rawPayload) {
    let formattedPayload = { ...rawPayload };

    // Strict ASD transformations
    if (assessmentId === 'BITSEA') {
      // ASD rejects 'N' (No Opportunity). Strip them out.
      if (Array.isArray(formattedPayload)) {
        formattedPayload = formattedPayload.filter(item => item.value !== 'N');
      } else {
        Object.keys(formattedPayload).forEach(key => {
          if (formattedPayload[key] === 'N') {
            formattedPayload[key] = null;
          }
        });
      }
    }

    return {
      destination: 'ASD',
      timestamp: new Date().toISOString(),
      client_id: clientId,
      caregiver_id: caregiverId,
      instrument_id: assessmentId,
      payload: formattedPayload
    };
  }

  /**
   * Prepares a payload for the Child First Comprehensive Clinical Record (CFCR)
   */
  static formatForCFCR(clientId, assessmentId, rawPayload, computedScores) {
    return {
      destination: 'CFCR',
      timestamp: new Date().toISOString(),
      record_id: clientId,
      module: assessmentId,
      data: rawPayload,
      metrics: computedScores
    };
  }

  /**
   * Generates a flattened CSV string for legacy import if API is unavailable.
   */
  static generateLegacyCSV(exportsArray) {
    if (!exportsArray || exportsArray.length === 0) return '';
    
    // Naive flattening for demonstration
    const headers = ['destination', 'timestamp', 'client_id', 'instrument_id', 'data_dump'];
    let csv = headers.join(',') + '\\n';
    
    exportsArray.forEach(exp => {
      const row = [
        exp.destination,
        exp.timestamp,
        exp.client_id || exp.record_id,
        exp.instrument_id || exp.module,
        `"${JSON.stringify(exp.payload || exp.data).replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\\n';
    });
    
    return csv;
  }
}
