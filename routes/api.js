/* ── AURUM — Product & Order API Routes (Supabase) ── */
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/products
router.get('/products', async (req, res) => {
  try {
    let query = supabase.from('products').select('*');
    const { collection, season } = req.query;
    if (collection) query = query.ilike('collection', collection);
    if (season) query = query.ilike('season', season);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Products fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (err) {
    if (err.code === 'PGRST116') return res.status(404).json({ error: 'Product not found' });
    console.error('Product fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/orders
router.post('/orders', async (req, res) => {
  try {
    const order = {
      items: req.body.items || [],
      customer_email: req.body.customer?.email || '',
      customer_name: req.body.customer?.name || '',
      total: req.body.total || 0,
      status: 'pending',
      payment_ref: req.body.paymentRef || null
    };
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    if (error) throw error;

    // Return in the same shape the frontend expects
    res.status(201).json({
      id: data.id,
      items: data.items,
      customer: { email: data.customer_email, name: data.customer_name },
      total: data.total,
      status: data.status,
      paymentRef: data.payment_ref,
      createdAt: data.created_at
    });
  } catch (err) {
    console.error('Order create error:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Order not found' });

    res.json({
      id: data.id,
      items: data.items,
      customer: { email: data.customer_email, name: data.customer_name },
      total: data.total,
      status: data.status,
      paymentRef: data.payment_ref,
      createdAt: data.created_at
    });
  } catch (err) {
    if (err.code === 'PGRST116') return res.status(404).json({ error: 'Order not found' });
    console.error('Order fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
