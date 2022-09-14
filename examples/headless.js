/* eslint-disable  no-alert, no-unused-vars, no-undef */

/*
 * SDK Code
 */
const CLIENT_ID =
  "AdVrVyh_UduEct9CWFHsaHRXKVxbnCDleEJdVOZdb52qSjrWkKDNd6E1CNvd5BvNrGSsXzgQ238dGgZ4";

async function createOrder(payload) {
  const basicAuth = btoa(`${CLIENT_ID}:`);

  const accessToken = await fetch(
    "https://api.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
      body: "grant_type=client_credentials",
    }
  )
    .then((res) => res.json())
    .then((res) => {
      return res.access_token;
    });

  const res = await fetch("https://api.sandbox.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const { id } = await res.json();

  return {
    id,
  };
}

async function config() {
  return await fetch(
    "https://cors-anywhere.herokuapp.com/https://www.sandbox.paypal.com/graphql?GetApplepayConfig",
    {
      method: "POST",
      // credentials: "include",
      // mode: "no-cors", // no-cors, *cors, same-origin
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `
          query GetApplepayConfig(
            $buyerCountry: CountryCodes!
            $clientId: String!
            $merchantId: [String]!
          ) {
            applepayConfig(
              buyerCountry: $buyerCountry
              clientId: $clientId
              merchantId: $merchantId
            ) {
              merchantCountry,
              supportedNetworks
            }
          }`,
        variables: {
          buyerCountry: "US",
          clientId: CLIENT_ID,
          merchantId: ["2V9L63AM2BYKC"],
        },
      }),
    }
  )
    .then((res) => res.json())
    .then(res => res.data.applepayConfig)
    .catch(console.error);
}

let orderID;

async function validateMerchant({ validationUrl }) {
  const { id } = await createOrder({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "1.00",
        },
        payee: {
          merchant_id: "2V9L63AM2BYKC",
        },
      },
    ],
  });

  orderID = id;

  return await fetch(
    "https://cors-anywhere.herokuapp.com/https://www.sandbox.paypal.com/graphql?GetApplepayConfig",
    {
      method: "POST",
      // credentials: "include",
      // mode: "no-cors", // no-cors, *cors, same-origin
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `
            query GetApplePayMerchantSession(
                $url : String!
                $orderID : String!
                $clientID : String!
                $merchantDomain : String!
            ) {
                applePayMerchantSession(
                    url: $url
                    orderID: $orderID
                    clientID: $clientID
                    merchantDomain: $merchantDomain
                ) {
                    session
                }
            }`,
        variables: {
          url: validationUrl,
          clientID: CLIENT_ID,
          orderID: id,
          merchantDomain: "sandbox-applepay-paypal-js-sdk.herokuapp.com",
        },
      }),
    }
  )
    .then((res) => res.json())
    .then((res) => res.data.applePayMerchantSession)
    .then((merchantSession) => {
      // console.log(merchantSession);
      const payload = atob(merchantSession.session);
      return JSON.parse(payload);
    })
    .catch(console.error);
}

async function approvePayment({ orderID, payment }) {
  console.log(JSON.stringify(payment, null, 4))
  return await fetch(
    "https://cors-anywhere.herokuapp.com/https://www.sandbox.paypal.com/graphql?ApproveApplePayPayment",
    {
      method: "POST",
      // credentials: "include",
      // mode: "no-cors", // no-cors, *cors, same-origin
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `
        mutation ApproveApplePayPayment(
          $token: ApplePayPaymentToken!
          $orderID: String!
           $clientID : String!
           $billingContact: ApplePayPaymentContact!
           $shippingContact: ApplePayPaymentContact
        ) {
          approveApplePayPayment(
            token: $token
            orderID: $orderID
            clientID: $clientID
            billingContact: $billingContact
            shippingContact: $shippingContact
          )
        }`,
        variables: {
          token: payment.token,
          billingContact: payment.billingContact,
          shippingContact: payment.shippingContact,
          clientID: CLIENT_ID,
          orderID,
        },
      }),
    }
  )
    .then((res) => res.json())
    .catch(console.error);
}

const applepay = {
  createOrder,
  config,
  validateMerchant,
  approvePayment,
};

/*
 * Merchant integration
 */

const randomNumber = (min, max) => Math.random() * (max - min) + min;

async function calculateShipping(postalCode) {
  return {
    taxRate: randomNumber(0.01, 0.0725), // 1% - 7.25%
    newShippingMethods: [
      {
        label: "Free Standard Shipping",
        amount: "0.00",
        detail: "Arrives in 5-7 days",
        identifier: "standardShipping",
        dateComponentsRange: {
          startDateComponents: {
            years: 2022,
            months: 9,
            days: 11,
            hours: 0,
          },
          endDateComponents: {
            years: 2022,
            months: 9,
            days: 13,
            hours: 0,
          },
        },
      },
      {
        label: "Express Shipping",
        amount: "1.00",
        detail: "Arrives in 2-3 days",
        identifier: "expressShipping",
        dateComponentsRange: {
          startDateComponents: {
            years: 2022,
            months: 9,
            days: 8,
            hours: 0,
          },
          endDateComponents: {
            years: 2022,
            months: 9,
            days: 9,
            hours: 0,
          },
        },
      },
    ],
  };
}

async function setupApplepay() {
  const { merchantCapabilities, merchantCountry, supportedNetworks } = await config()

  //  const applepay = paypal.Applepay();
  /*
    const {
      isApplePayEligible,
      countryCode,
      currencyCode,
      merchantCapabilities,
      supportedNetworks,
    } = await  config() //applepay.getConfiguration();
  */
  //if (!isApplePayEligible) {
  // throw new Error("applepay is not eligible");
  // }

  document.getElementById("applepay-container").innerHTML =
    '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en">';

  document.getElementById("btn-appl").addEventListener("click", onClick);

  async function onClick() {
    console.log({ merchantCapabilities, merchantCountry, supportedNetworks })

    const paymentRequest = {
      countryCode: merchantCountry,
      currencyCode: "USD",
      merchantCapabilities: ["supports3DS"],
      supportedNetworks,
      shippingMethods: [
        {
          label: "Free Standard Shipping",
          amount: "0.00",
          detail: "Arrives in 5-7 days",
          identifier: "standardShipping",
          dateComponentsRange: {
            startDateComponents: {
              years: 2022,
              months: 9,
              days: 11,
              hours: 0,
            },
            endDateComponents: {
              years: 2022,
              months: 9,
              days: 13,
              hours: 0,
            },
          },
        },
        {
          label: "Express Shipping",
          amount: "1.00",
          detail: "Arrives in 2-3 days",
          identifier: "expressShipping",
          dateComponentsRange: {
            startDateComponents: {
              years: 2022,
              months: 9,
              days: 8,
              hours: 0,
            },
            endDateComponents: {
              years: 2022,
              months: 9,
              days: 9,
              hours: 0,
            },
          },
        },
      ],
      shippingType: "shipping",
      requiredBillingContactFields: [
        "postalAddress",
        "name" /*"phoneticName"*/,
      ],
      requiredShippingContactFields: [
        "postalAddress",
        "name",
        "phone",
        "email",
      ],
      lineItems: [
        {
          label: "Goods",
          amount: "100.00",
        },
        {
          label: "Sales Tax",
          amount: "7.00",
        },
        {
          label: "Shipping",
          amount: "1.00",
        },
      ],
      total: {
        label: "Demo (Card is not charged)",
        amount: "1.08",
        type: "final",
      },
    };

    var session = new ApplePaySession(4, paymentRequest);

    session.onvalidatemerchant = (event) => {
      applepay
        .validateMerchant({
          validationUrl: event.validationURL,
        })
        .then((payload) => {
          session.completeMerchantValidation(payload);
        })
        .catch((err) => {
          console.error(err);
          session.abort();
        });
    };

    session.onpaymentmethodselected = (event) => {
      console.log("onpaymentmethodselected");
      console.log(event.paymentMethod); // {type: "credit"}

      session.completePaymentMethodSelection({
        newTotal: paymentRequest.total,
        newLineItems: paymentRequest.lineItems,
        errors: [],
      });
    };

    session.onshippingcontactselected = async (event) => {
      /*
       * US Shipping only
       */
      if (event.shippingContact.countryCode !== "US") {
        return session.completeShippingContactSelection({
          errors: [
            new ApplePayError(
              "shippingContactInvalid",
              "postalCode",
              "Sorry we only ship to the US currently"
            ),
          ],
        });
      }

      console.log("onshippingcontactselected");
      console.log(JSON.stringify(event.shippingContact, null, 4));

      const { postalCode } = event.shippingContact;

      const { newShippingMethods, taxRate } = await calculateShipping(postalCode);

      const goodsItem = paymentRequest.lineItems.find(
        (item) => item.label === "Goods"
      );

      const newLineItems = [
        { ...goodsItem },
        {
          label: "Shipping",
          amount: newShippingMethods[0]?.amount,
        },
        {
          label: "Sales Tax",
          amount: (taxRate * parseFloat(goodsItem.amount)).toFixed(2),
        },
      ];

      const totalAmount = newLineItems.reduce(
        (total, item) => total + parseFloat(item.amount),
        0
      );

      console.log(
        JSON.stringify(
          { totalAmount, newLineItems, newShippingMethods },
          null,
          4
        )
      );

      const newTotal = {
        label: "Demo (Card is not charged)",
        amount: totalAmount.toFixed(2),
        type: "final",
      };

      const shippingContactUpdate = {
        newTotal,
        newLineItems,
        newShippingMethods,
        errors: [],
      };

      Object.assign(paymentRequest, {
        lineItems: newLineItems,
        total: newTotal,
      });

      session.completeShippingContactSelection(shippingContactUpdate);
    };

    session.onshippingmethodselected = (event) => {
      console.log("onshippingmethodselected");
      console.log(JSON.stringify(event.shippingMethod, null, 4));

      const newLineItems = [
        {
          ...paymentRequest.lineItems.find((item) => item.label == "Goods"),
        },
        {
          ...paymentRequest.lineItems.find((item) => item.label == "Sales Tax"),
        },
        {
          label: "Shipping",
          amount: event.shippingMethod.amount,
        },
      ];

      let totalAmount = newLineItems.reduce(
        (total, item) => total + parseFloat(item.amount),
        0
      );

      const newTotal = {
        label: "Demo (Card is not charged)",
        amount: totalAmount.toFixed(2),
        type: "final",
      };

      const shippingMethodUpdate = {
        newTotal,
        newLineItems,
        errors: [],
      };

      Object.assign(paymentRequest, {
        lineItems: newLineItems,
        total: newTotal,
      });

      session.completeShippingMethodSelection(shippingMethodUpdate);
    };

    session.onpaymentauthorized = async (event) => {
      try {
        console.log("onpaymentauthorized");
        console.log(JSON.stringify(event, null, 4));

        const { id } = await createOrder({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: paymentRequest.total.amount,
              },
              payee: {
                merchant_id: "2V9L63AM2BYKC",
              },
            },
          ],
        });

        event.payment.billingContact.postalCode = "ABC@@@@@!!!!!"

        await applepay.approvePayment({ orderID: id, payment: event.payment });

        session.completePayment({
          status: window.ApplePaySession.STATUS_SUCCESS,
        });
      } catch (err) {
        console.error(err);
        session.completePayment({
          status: window.ApplePaySession.STATUS_FAILURE,
        });
      }
    };

    session.begin();
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOMContentLoaded");

  if(ApplePaySession?.supportsVersion(4) && ApplePaySession?.canMakePayments()) {
    setupApplepay().catch(console.log);
  }
});
