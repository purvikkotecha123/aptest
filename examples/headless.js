/* eslint-disable  no-alert, no-unused-vars, no-undef */

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
          clientId:
            "AdVrVyh_UduEct9CWFHsaHRXKVxbnCDleEJdVOZdb52qSjrWkKDNd6E1CNvd5BvNrGSsXzgQ238dGgZ4",
          merchantId: ["2V9L63AM2BYKC"],
        },
      }),
    }
  )
    .then((res) => res.json())
    .catch(console.error);
}

async function validateMerchant({ validationUrl }) {
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
          clientID:
            "AdVrVyh_UduEct9CWFHsaHRXKVxbnCDleEJdVOZdb52qSjrWkKDNd6E1CNvd5BvNrGSsXzgQ238dGgZ4",
          orderID: "3A499933V7998380D",
          merchantDomain: "sandbox-applepay-paypal-js-sdk.herokuapp.com",
        },
      }),
    }
  )
    .then((res) => res.json())
    .then((res) => res.data.applePayMerchantSession)
    .catch(console.error);
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

  console.log(JSON.stringify(await config(), null, 4));

  document.getElementById("applepay-container").innerHTML =
    '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en">';

  document.getElementById("btn-appl").addEventListener("click", onClick);

  function onClick() {
    console.log("CLICK");

    const applePayPaymentRequest = {
      countryCode: "US",
      currencyCode: "USD",
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["masterCard", "discover", "visa", "amex"],
      requiredShippingContactFields: [
        "postalAddress",
        "name",
        "phone",
        "email",
      ],
      lineItems: [
        {
          label: "Sales Tax",
          amount: "0.00",
        },
        {
          label: "Shipping",
          amount: "0.00",
        },
      ],
      total: {
        label: "Demo",
        type: "final",
        amount: "99.99",
      },
    };

    var session = new ApplePaySession(4, applePayPaymentRequest);

    session.onvalidatemerchant = (event) => {
      validateMerchant({
        validationUrl: event.validationURL,
      })
        .then((merchantSession) => {
          console.log(merchantSession);
          const payload = atob(merchantSession.session);
          session.completeMerchantValidation(JSON.parse(payload));
        })
        .catch((err) => {
          console.error(err);
          session.abort();
        });
    };

    session.onpaymentmethodselected = () => {
      session.completePaymentMethodSelection({
        newTotal: {
          ...applePayPaymentRequest.total,
        },
        newLineItems: [],
      });
    };

    session.onshippingcontactselected = (event) => {
      const shippingContactUpdate = {
        newTotal: {
          ...applePayPaymentRequest.total,
        },
        newLineItems: [],
      };
      session.completeShippingContactSelection(shippingContactUpdate);
    };

    session.onshippingmethodselected = (event) => {
      const shippingMethodUpdate = {
        newTotal: {
          ...applePayPaymentRequest.total,
        },
        newLineItems: [],
      };
      session.completeShippingMethodSelection(shippingMethodUpdate); // Set shippingMethodUpdate=null if there are no updates.
    };

    session.onpaymentauthorized = (event) => {
      alert("onpaymentauthorized");
      session.completePaymentMethodSelection({});
    };

    session.begin();
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOMContentLoaded");
  setupApplepay().catch(console.log);
});
