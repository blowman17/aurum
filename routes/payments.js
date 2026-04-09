/* ── AURUM — Paystack Payment Routes (Supabase) ── */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');

const SECRET = process.env.PAYSTACK_SECRET_KEY;
const PUBLIC = process.env.PAYSTACK_PUBLIC_KEY;

// POST /api/payments/initialize
router.post('/initialize', async (req, res) => {
  const { email, amount, name, items } = req.body;
  if (!email || !amount) return res.status(400).json({ error: 'Email and amount required' });

  const reference = 'AUR-' + uuidv4().slice(0, 8).toUpperCase();
  const amountKobo = Math.round(amount * 100); // Paystack uses pesewas for GHS

  try {
    // Save order to Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        items: items || [],
        customer_email: email,
        customer_name: name || '',
        total: amount,
        status: 'pending',
        payment_ref: reference
      })
      .select()
      .single();
    if (error) throw error;

    // If we have a real Paystack secret key, use the API
    if (SECRET && !SECRET.includes('xxxxx')) {
      try {
        const psRes = await axios.post('https://api.paystack.co/transaction/initialize', {
          email, amount: amountKobo, currency: 'GHS',
          reference, callback_url: req.headers.origin + '/checkout.html?success=true&ref=' + reference,
          metadata: { order_id: order.id, customer_name: name }
        }, {
          headers: { Authorization: 'Bearer ' + SECRET, 'Content-Type': 'application/json' }
        });
        return res.json({
          authorization_url: psRes.data.data.authorization_url,
          reference: psRes.data.data.reference,
          orderId: order.id
        });
      } catch (err) {
        console.error('Paystack error:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Payment initialization failed' });
      }
    }

    // Demo mode (no real keys): return data for inline popup
    res.json({
      reference, publicKey: PUBLIC, email, amountKobo,
      orderId: order.id, mode: 'demo',
      authorization_url: null
    });
  } catch (err) {
    console.error('Payment init error:', err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// GET /api/payments/verify/:reference
router.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;

  try {
    if (SECRET && !SECRET.includes('xxxxx')) {
      const psRes = await axios.get('https://api.paystack.co/transaction/verify/' + reference, {
        headers: { Authorization: 'Bearer ' + SECRET }
      });
      const data = psRes.data.data;
      if (data.status === 'success') {
        // Update order status in Supabase
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('payment_ref', reference);
        return res.json({ status: 'success', amount: data.amount / 100, reference });
      }
      return res.json({ status: 'failed' });
    }

    // Demo mode: auto-succeed
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('payment_ref', reference);
    res.json({ status: 'success', reference, mode: 'demo' });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
