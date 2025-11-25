import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!existsSync(tempDir)) {
  await mkdir(tempDir, { recursive: true });
}

// Load SCAD template
let scadTemplate = null;
async function loadScadTemplate() {
  if (!scadTemplate) {
    const templatePath = path.join(__dirname, 'template.scad');
    scadTemplate = await readFile(templatePath, 'utf8');
  }
  return scadTemplate;
}

// Generate SCAD code from parameters
async function generateScadCode(lens, strapWidth, fnValue = 20) {
  const template = await loadScadTemplate();
  const sortedLens = [...lens].sort((a, b) => a - b);
  const lensArray = sortedLens.join(', ');
  
  // Replace placeholders in template
  let scadCode = template
    .replace('LENS_ARRAY', `[${lensArray}]`)
    .replace('STRAP_WIDTH', strapWidth.toString());
  
  // Add $fn at the beginning
  return `$fn = ${fnValue};\n${scadCode}`;


// Render SCAD to STL
async function renderScadToStl(scadCode, fnValue = 20, outputPath) {
  const scadPath = outputPath.replace('.stl', '.scad');
  
  try {
    // Write SCAD file (fnValue is already in the code)
    await writeFile(scadPath, scadCode, 'utf8');
    
    // Render to STL using OpenSCAD
    const command = `openscad -o "${outputPath}" "${scadPath}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.warn('OpenSCAD stderr:', stderr);
    }
    
    // Check if STL file was created
    if (!existsSync(outputPath)) {
      throw new Error('OpenSCAD failed to generate STL file');
    }
    
    // Read STL file
    const stlBuffer = await readFile(outputPath);
    
    // Cleanup
    await unlink(scadPath);
    await unlink(outputPath);
    
    return stlBuffer;
  } catch (error) {
    // Cleanup on error
    try {
      if (existsSync(scadPath)) await unlink(scadPath);
      if (existsSync(outputPath)) await unlink(outputPath);
    } catch {}
    
    // Provide better error messages
    if (error.message && error.message.includes('openscad')) {
      throw new Error('OpenSCAD is not installed or not in PATH. Please install OpenSCAD.');
    }
    throw error;
  }
}

// API: Preview (free, low quality)
app.post('/api/preview', async (req, res) => {
  try {
    const { lens, strapWidth } = req.body;
    
    if (!Array.isArray(lens) || lens.length === 0) {
      return res.status(400).json({ error: 'lens array is required' });
    }
    
    if (!strapWidth || strapWidth < 1 || strapWidth > 50) {
      return res.status(400).json({ error: 'strapWidth must be between 1 and 50' });
    }
    
    const tempId = Date.now().toString();
    const stlPath = path.join(tempDir, `${tempId}.stl`);
    
    // Low quality preview (fn=20)
    const scadCode = await generateScadCode(lens, strapWidth, 20);
    const stlBuffer = await renderScadToStl(scadCode, 20, stlPath);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="preview.stl"');
    res.send(stlBuffer);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate preview' });
  }
});

// API: Create Stripe checkout session
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { lens, strapWidth, email } = req.body;
    
    if (!Array.isArray(lens) || lens.length === 0) {
      return res.status(400).json({ error: 'lens array is required' });
    }
    
    if (!strapWidth || strapWidth < 1 || strapWidth > 50) {
      return res.status(400).json({ error: 'strapWidth must be between 1 and 50' });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    // Store parameters in session metadata
    const sortedLens = [...lens].sort((a, b) => a - b);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Lens Cap Holder STL',
              description: `Custom STL file for ${sortedLens.join(', ')}mm lens caps`,
            },
            unit_amount: 150, // $1.50
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || process.env.FRONTEND_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || process.env.FRONTEND_URL}/?payment=cancelled`,
      customer_email: email,
      metadata: {
        lens: JSON.stringify(sortedLens),
        strapWidth: strapWidth.toString(),
        email: email,
      },
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

// API: Download STL after payment
app.get('/api/download-stl/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(403).json({ error: 'Payment not completed' });
    }
    
    const lens = JSON.parse(session.metadata.lens);
    const strapWidth = parseFloat(session.metadata.strapWidth);
    
    const tempId = Date.now().toString();
    const stlPath = path.join(tempDir, `${tempId}.stl`);
    
    // High quality STL (fn=120)
    const scadCode = await generateScadCode(lens, strapWidth, 120);
    const stlBuffer = await renderScadToStl(scadCode, 120, stlPath);
    
    const filename = `${lens.join('-')}mm.stl`;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(stlBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate STL' });
  }
});

// API: Stripe webhook (for email sending)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      const lens = JSON.parse(session.metadata.lens);
      const strapWidth = parseFloat(session.metadata.strapWidth);
      const email = session.metadata.email;
      
      // Generate STL (high quality)
      const tempId = Date.now().toString();
      const stlPath = path.join(tempDir, `${tempId}.stl`);
      const scadCode = await generateScadCode(lens, strapWidth, 120);
      const stlBuffer = await renderScadToStl(scadCode, 120, stlPath);
      
      // Send email with STL attachment
      const filename = `${lens.join('-')}mm.stl`;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Your Lens Cap Holder STL File',
        html: `
          <h2>Thank you for your purchase!</h2>
          <p>Your custom lens cap holder STL file is attached.</p>
          <p><strong>Lens sizes:</strong> ${lens.join(', ')}mm</p>
          <p><strong>Strap width:</strong> ${strapWidth}mm</p>
          <p>Happy 3D printing!</p>
        `,
        attachments: [
          {
            filename: filename,
            content: stlBuffer,
          },
        ],
      });
      
      console.log(`Email sent to ${email} for session ${session.id}`);
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Don't throw - we want to return 200 to Stripe even if email fails
      // This prevents Stripe from retrying the webhook unnecessarily
    }
  }
  
  res.json({ received: true });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Validate environment variables
const requiredEnvVars = ['STRIPE_SECRET_KEY', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.warn('Warning: Missing environment variables:', missingVars.join(', '));
  console.warn('Some features may not work properly. Please check your .env file.');
}

// Test OpenSCAD availability
execAsync('openscad --version')
  .then(() => {
    console.log('OpenSCAD is available');
  })
  .catch(() => {
    console.warn('Warning: OpenSCAD not found in PATH. STL generation will fail.');
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenSCAD must be installed and available in PATH`);
});

