const express = require("express");
const Stripe = require("stripe");
const createOrder = require("../controllers/order.controller");
const logger=require('../utils/logger.util');
require("dotenv").config();

const stripe = Stripe(process.env.STRIP_TEST_KEY);

const router = express.Router();
/**
 * @openapi
 * '/api/payment':
 *  post:
 *      tags:
 *      - Payment
 *      summary: Create Payment Using Stripe
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - userId
 *                  - customername
 *                  - cartItems
 *                properties:
 *                  userId:
 *                      type: number
 *                  customername:
 *                      type: string
 *                  cartItems:
 *                      type: array
 *                      cartItems:
 *                            type: object
 *        responses:
 *          200:
 *            description: Success
 *          400:
 *            description: Bad request
 *          404:
 *            description: Not Found
 */
router.post("/", async (req, res) => {
  if (!req.body.userId) {
    res.status(400).json({ error: "true", message: "Please Provide User Id" });
    return;
  }
  if (!req.body.customername || req.body.customername.trim().length === 0) {
    res
      .status(400)
      .json({ error: "true", message: "Please Provide Customer Name" });
    return;
  }
  if (!req.body.cartItems || req.body.cartItems.length === 0) {
    res
      .status(400)
      .json({ error: "true", message: "Please Provide Cart Items" });
    return;
  }
  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userId,
      userName: req.body.customername,
      cart: JSON.stringify(req.body.cartItems),
    },
  });
  const line_items = req.body.cartItems.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
          description: item.desc,
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    };
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["US", "CA"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "usd",
          },
          display_name: "Free shipping",
          // Delivers between 5-7 business days
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "usd",
          },
          display_name: "Next day air",
          // Delivers in exactly 1 business day
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    customer: customer.id,
    line_items,
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}?success=true`,
    cancel_url: `${process.env.CLIENT_URL}?cancelled=true`,
  });
  res.json({ url: session.url });
});

// server.js
const endpointSecret = process.env.WEBHOOK_SECRET;

//Web Hook Post Request Will get Called Automatically
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const payload = request.body;
    const payloadString = JSON.stringify(payload, null, 2);
    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: endpointSecret,
    });
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        payloadString,
        header,
        endpointSecret
      );
      logger.log("Webhook Verified");
    } catch (err) {
      logger.error(`Webhook Error: ${err.message}`)
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    let data = event.data.object;
    let eventType = event.type;
    // Handle the event
    if (eventType === "checkout.session.completed") {
      try {
        let customer = await stripe.customers.retrieve(data.customer);
        createOrder(customer, data);
      } catch (error) {
        logger.error(error.message);
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send().end();
  }
);
//Default Not Found Route 
router.all("*",(req,res)=>{
  res.json({ message:"API Not Found!" })
})

module.exports = router;
