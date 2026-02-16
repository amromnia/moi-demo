/**
 * Synchronize user with the kiosk registration service
 * Calls the backend API which:
 * 1. Fetches user profile from MOI API
 * 2. Authenticates with kiosk service
 * 3. Registers/updates user in kiosk service
 * 
 * @param {string} memberId - User's member ID
 * @param {string} accessToken - User's access token for MOI API authentication
 * @returns {Promise<{success: boolean, message?: string, step?: string, details?: string}>}
 */
export async function syncWithTrafficService(memberId, accessToken) {
  try {
    // Validate memberId
    if (!memberId || typeof memberId !== 'string') {
      console.error('Invalid memberId:', { hasMemberId: !!memberId, type: typeof memberId });
      return {
        success: false,
        message: 'معرف العضو غير صالح',
        error: 'Invalid memberId'
      };
    }

    // Validate accessToken
    if (!accessToken || typeof accessToken !== 'string') {
      console.error('Invalid accessToken:', { hasAccessToken: !!accessToken, type: typeof accessToken });
      return {
        success: false,
        message: 'رمز المصادقة غير صالح',
        error: 'Invalid accessToken'
      };
    }

    const response = await fetch('/api/traffic-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        memberId: memberId,
        accessToken: accessToken
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Traffic sync request failed:', response.status, result);
      return {
        success: false,
        message: result.message || 'فشلت عملية المزامنة',
        step: result.step,
        details: result.details,
        error: result.error,
        sessionExpired: result.sessionExpired || false
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
