const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51PpvwqCEznMB5JY2D58bTtep3ppXm5GYt02WpEbHrkDEWut6HP4bItyltoIPJAXXg0l6UOSsmU5I33eOQArW1jPk00NC8z3YZI'); // Replace with your Stripe secret key
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PayPal setup
function environment() {
  return new paypal.core.SandboxEnvironment('AQe74X-UVQ4YoNgDU4rEEA-Yzfi5eh07csN4yxg80E58Fq2jA0ys6NaZPToQxMjDsuPCpvvrj5pwTbz1', 
    'EDq6LZBd8hckjYQwmgHpWXCMLaXCX5lZ8jdGI5dAMozpBDRpDha4nhkZtI1w9xa13thlxKUsB06mSsns'); // Replace with your PayPal credentials
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Endpoint for creating a Stripe payment intent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  const { amount } = req.body; // amount in cents

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint for creating a PayPal order
app.post('/api/paypal/create-order', async (req, res) => {
  const { amount } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: amount,
        },
      },
    ],
  });

  try {
    const order = await client().execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint for capturing PayPal order
app.post('/api/paypal/capture-order', async (req, res) => {
  const { orderId } = req.body;

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client().execute(request);
    res.json(capture.result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
