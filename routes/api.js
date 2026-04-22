/* ── AURUM — Product & Order API Routes (Supabase) ── */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supabase = require('../lib/supabase');
const { notifyAdmin } = require('../lib/notifications');

/* ── Image Upload Config ─────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'images')),
  filename: (req, file, cb) => {
    const slug = file.originalname
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const ext = path.extname(file.originalname);
    cb(null, slug + '-' + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
             && allowed.test(file.mimetype.split('/')[1]);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  req.user = user;
  next();
};

/* ── Upload Endpoint ─────────────────────── */
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  res.json({ path: 'images/' + req.file.filename });
});

/* ── GET /api/products ───────────────────── */
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

/* ── GET /api/products/:id ───────────────── */
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

/* ── POST /api/products ──────────────────── */
router.post('/products', async (req, res) => {
  try {
    const { id, name, collection, season, price, description, sizes, gradient, image, tag } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const product = {
      id: id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name,
      collection: collection || '',
      season: season || '',
      price: Number(price),
      description: description || '',
      sizes: sizes || ['S', 'M', 'L'],
      gradient: gradient || 'linear-gradient(160deg,#1c1825 0%,#2a1f3a 50%,#1a1520 100%)',
      image: image || '',
      tag: tag || ''
    };

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Product create error:', err.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/* ── PUT /api/products/:id ───────────────── */
router.put('/products/:id', async (req, res) => {
  try {
    const updates = {};
    const fields = ['name', 'collection', 'season', 'price', 'description', 'sizes', 'gradient', 'image', 'tag'];
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.price !== undefined) updates.price = Number(updates.price);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (err) {
    if (err.code === 'PGRST116') return res.status(404).json({ error: 'Product not found' });
    console.error('Product update error:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/* ── DELETE /api/products/:id ────────────── */
router.delete('/products/:id', async (req, res) => {
  try {
    const { error, count } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    console.error('Product delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/* ── POST /api/orders ────────────────────── */
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const order = {
      items: req.body.items || [],
      customer_email: req.user.email,
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

/* ── GET /api/orders/:id ─────────────────── */
router.get('/orders/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Order not found' });
    if (data.customer_email !== req.user.email) return res.status(403).json({ error: 'Order belongs to another account' });

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

/* ── GET /api/orders — List all orders (admin/customer) ── */
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', req.user.email)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Orders fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/* ── PATCH /api/orders/:id/status — Update order status (admin) ── */
router.patch('/orders/:id/status', requireAuth, async (req, res) => {
  try {
    return res.status(403).json({ error: 'Forbidden: Customers cannot update order status directly' });
  } catch (err) {
    if (err.code === 'PGRST116') return res.status(404).json({ error: 'Order not found' });
    console.error('Order status update error:', err.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/* ── GET /api/orders/track/:ref — Customer order tracking ── */
router.get('/orders/track/:ref', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, items, customer_name, customer_email, total, status, payment_ref, created_at')
      .eq('payment_ref', req.params.ref)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Order not found' });
    if (data.customer_email !== req.user.email) return res.status(403).json({ error: 'Order belongs to another account' });

    res.json({
      id: data.id,
      items: data.items,
      customerName: data.customer_name,
      total: data.total,
      status: data.status,
      paymentRef: data.payment_ref,
      createdAt: data.created_at
    });
  } catch (err) {
    if (err.code === 'PGRST116') return res.status(404).json({ error: 'Order not found. Check your reference number.' });
    console.error('Order track error:', err.message);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

module.exports = router;
