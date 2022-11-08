const express = require("express");
const { resolve } = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { getAccessToken } = require("./paypal");
const { PORT, PAYPAL_API_BASE } = require("./config");
const { requireHTTPS } = require("./middleware");

const app = express();

app.use(requireHTTPS);
app.use(express.json());
app.use(express.static(resolve(__dirname, "../examples")));

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "../examples/index.html"));
});

app.get(
  "/.well-known/apple-developer-merchantid-domain-association",
  (req, res) => {
    res.sendFile(
      resolve(__dirname, "../.well-known/apple-developer-domain-association")
    );
  }
);

app.patch("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const { access_token } = await getAccessToken();

    const { data, headers } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: req.body,
    });

    const debugID = headers["paypal-debug-id"];

    res.json({ debugID, ...data });
  } catch (err) {
    res.status(422).json(err.response.data);
  }
});

app.post("/calculate-shipping", (req, res) => {
  // mock sales tax rate
  res.json({
    taxRate: 0.0725, // 7.25%
  });
});

app.post("/capture/:orderId", async (req, res) => {

  const { orderId } = req.params;

  const { access_token } = await getAccessToken();

  const { data, headers } = await axios({
    url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: 'return=representation',
      Authorization: `Bearer ${access_token}`,
    },
  });

  const debugID = headers["paypal-debug-id"];

  res.json({ debugID, ...data });
});

app.get("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const { access_token } = await getAccessToken();
    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      }
    });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.json({
      msg: err.message,
      details: err.toString(),
      body: req.body,
      orderId,
    });
  }
});

app.get("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const { access_token } = await getAccessToken();
    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      }
    });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.json({
      msg: err.message,
      details: err.toString(),
      body: req.body,
      orderId,
    });
  }
});

app.post("/orders", async (req, res) => {
  const order = req.body || {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "9.99",
        },
        payee: {
          merchant_id: "2V9L63AM2BYKC"
        }
      },
    ],
  };

  try {
    const { access_token } = await getAccessToken();

    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: {...order}
    });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.json({
      msg: err.message,
      details: err.toString(),
      body: req.body,
    });
  }
});


app.listen(PORT, async () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
