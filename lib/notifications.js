/* ── AURUM — Admin Order Notification Helper ──
 * Calls the Supabase Edge Function to notify admin
 * about new/paid orders via email, WhatsApp, and SMS.
 * ─────────────────────────────────────────────── */

const EDGE_FN_URL = process.env.SUPABASE_URL + '/functions/v1/notify-admin-order';

/**
 * Notify admin about an order event.
 * @param {object} order - The order record from Supabase
 * @returns {Promise<object>} Notification results
 */
async function notifyAdmin(order) {
  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'INSERT',
        record: order
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('⚠  Notification edge function error:', res.status, text);
      return { success: false, error: text };
    }

    const data = await res.json();
    console.log('✦ Admin notified:', JSON.stringify(data.notifications));
    return data;
  } catch (err) {
    // Non-fatal — order was already saved
    console.error('⚠  Notification send failed (non-fatal):', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { notifyAdmin };
