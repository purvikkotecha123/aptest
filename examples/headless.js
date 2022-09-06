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
      return JSON.parse(payload)
    })
    .catch(console.error);
}

async function approvePayment({ orderID, payment }) {
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
  approvePayment
}



/*
* Merchant integration
*/

async function caclulateShipping(postalCode) {
  return {
    taxRate: 0.0725, // 7.25%
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

  function onClick() {
    const applePayPaymentRequest = {
      countryCode: "US",
      currencyCode: "USD",
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["masterCard", "discover", "visa", "amex"],
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
          amount: "1.00",
        },
        {
          label: "Sales Tax",
          amount: "1.00",
        },
        {
          label: "Shipping",
          amount: "1.00",
        },
      ],
      total: {
        label: "Demo (Card is not charged)",
        amount: "3.00",
        type: "final",
      },
    };

    var session = new ApplePaySession(4, applePayPaymentRequest);

    session.onvalidatemerchant = (event) => {
      applepay.validateMerchant({
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
        newTotal: {
          ...applePayPaymentRequest.total,
        },
        newLineItems: [
          ...applePayPaymentRequest.lineItems
        ],
        errors: []
      });
    };

    session.onshippingcontactselected = async (event) => {
      if (event.shippingContact.countryCode !== "US") {
        return session.completeShippingContactSelection({
          errors: [
            new ApplePayError("shippingContactInvalid", "postalCode", "ZIP Code is invalid")
          ]
        });
      }

      console.log("onshippingcontactselected");
      console.log(JSON.stringify(event.shippingContact, null, 4));

      const { newShippingMethods, taxRate } = await caclulateShipping(
        event.shippingContact.postalCode
      );

      const newLineItems = [
        {
          label: "Goods",
          amount: "1.00",
        },
        {
          label: "Shipping",
          amount: newShippingMethods[0]?.amount,
        },
      ];

      newLineItems.push({
        label: "Sales Tax",
        amount: (
          taxRate *
          parseFloat(newLineItems.find((item) => item.label === "Goods").amount)
        ).toString(),
      });


      let totalAmount = newLineItems
        .reduce((total, item) => total + parseFloat(item.amount), 0)

        console.log(JSON.stringify({ totalAmount, newLineItems }, null, 4))

      const shippingContactUpdate = {
        newTotal: {
          label: "Demo (Card is not charged)",
          amount: totalAmount.toString(),
          type: "final",
        },
        newLineItems,
        newShippingMethods,
        errors: []
      };

      session.completeShippingContactSelection(shippingContactUpdate);
    };

    session.onshippingmethodselected = (event) => {
      console.log("onshippingmethodselected");
      console.log(JSON.stringify(event.shippingMethod, null, 4));

      const shippingMethodUpdate = {
        newTotal: {
          label: "Demo (Card is not charged)",
          amount: "5.00",
          type: "final",
        },
        newLineItems: [
          {
            label: "Goods",
            amount: "1.00",
          },
          {
            label: "Sales Tax",
            amount: "2.00",
          },
          {
            label: "Shipping",
            amount: "2.00",
          },
        ],
        errors: []
      };

      session.completeShippingMethodSelection(shippingMethodUpdate);
    };

    session.onpaymentauthorized = async (payment) => {
      try {
        console.log("onpaymentauthorized");
        console.log(payment, null, 4);
        await applepay.approvePayment({ orderID, payment });

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
  setupApplepay().catch(console.log);
});
