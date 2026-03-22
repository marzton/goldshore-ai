// data.worker.ts

// This is a Web Worker, so it runs in a separate thread.
// It's responsible for fetching and normalizing data to keep the main thread clear.

const normalizeData = (data: any[]) => {
  // TODO: Implement actual data normalization logic.
  // This could involve fetching from Supabase, calculating correlations (rho),
  // and identifying anomalies based on 2-sigma thresholds.
  console.log('[Worker] Normalizing data...');
  return data;
};

// Listen for messages from the main thread.
self.onmessage = (event) => {
  console.log('[Worker] Received message from main thread:', event.data);

  if (event.data.type === 'FETCH_DATA') {
    // In a real implementation, this would trigger a fetch from a Supabase Edge Function.
    const mockSignals = [
      { name: '10Y', rho: 0.8, category: 'Macro', isAnomaly: false },
      { name: 'SPX', rho: 0.65, category: 'Macro', isAnomaly: false },
      { name: 'VIX', rho: -0.5, category: 'Macro', isAnomaly: true },
      { name: 'UFO', rho: 0.3, category: 'Sector', isAnomaly: false },
      { name: 'AVAV', rho: 0.45, category: 'Competitor', isAnomaly: false },
      // Add more signals to test the radar
      { name: 'TSLA', rho: 0.2, category: 'Competitor', isAnomaly: false },
      { name: 'BTC', rho: -0.1, category: 'Macro', isAnomaly: false },
    ];
    
    const normalizedData = normalizeData(mockSignals);

    // Send the normalized data back to the main thread.
    self.postMessage({
      type: 'DATA_READY',
      payload: normalizedData,
    });
  }
};

console.log('[Worker] Data worker initialized.');
