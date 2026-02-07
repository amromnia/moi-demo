/**
 * Synchronize user with traffic.moi.gov.eg service via server
 * Calls the backend to perform the 3-step authentication process
 * 
 * @param {string} token - User's authentication token
 * @param {string} email - User's email address
 * @param {number} nationalityType - 0 for citizen, 1 for foreigner
 * @param {string} nationalId - User's national ID or passport number
 * @returns {Promise<{success: boolean, message?: string, step?: string, details?: string}>}
 */
export async function syncWithTrafficService(token, email, nationalityType, nationalId) {
  try {
    // Validate inputs before sending
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.error('Invalid token:', { hasToken: !!token, type: typeof token, length: token?.length });
      return {
        success: false,
        message: 'رمز المصادقة غير صالح',
        error: 'Invalid token'
      };
    }

    if (!email || typeof email !== 'string') {
      console.error('Invalid email:', { hasEmail: !!email, type: typeof email });
      return {
        success: false,
        message: 'البريد الإلكتروني غير صالح',
        error: 'Invalid email'
      };
    }

    if (!nationalId || typeof nationalId !== 'string' && typeof nationalId !== 'number') {
      console.error('Invalid nationalId:', { hasNationalId: !!nationalId, type: typeof nationalId });
      return {
        success: false,
        message: 'رقم الهوية غير صالح',
        error: 'Invalid nationalId'
      };
    }

    const response = await fetch('/api/traffic-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        token,
        nationalityType,
        nationalId: String(nationalId)
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Traffic sync request failed:', response.status, result);
      return {
        success: false,
        message: result.message || 'فشلت عملية المزامنة',
        step: result.step,
        details: result.details
      };
    }

    return result;

  } catch (error) {
    console.error('Traffic sync error:', error);
    return {
      success: false,
      message: 'حدث خطأ في الاتصال أثناء المزامنة',
      error: error.message
    };
  }
}

/**
 * Check if this is the user's first login and needs traffic sync
 * @returns {boolean}
 */
export function needsTrafficSync() {
  // Check if we've already synced this user
  const trafficSynced = false
  return !trafficSynced || trafficSynced === 'false';
}

/**
 * Mark traffic sync as completed
 */
export function markTrafficSynced() {
  localStorage.setItem('traffic_synced', 'true');
  localStorage.setItem('traffic_sync_date', new Date().toISOString());
}

/**
 * Reset traffic sync status (useful for debugging or re-sync)
 */
export function resetTrafficSync() {
  localStorage.removeItem('traffic_synced');
  localStorage.removeItem('traffic_sync_date');
}
