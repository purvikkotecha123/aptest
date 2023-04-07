/* eslint-disable  no-alert, no-unused-vars, no-undef */

/*
 * SDK Code
 */

/*
 * Merchant integration - full shipping
 */

const randomNumber = (min, max) => Math.random() * (max - min) + min;

/*
 * this is a fake call to a merchant endpoint to calc shipping based off of zip change
 */
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
  const applepay = paypal.Applepay();
  const {
    isEligible,
    countryCode,
    currencyCode,
    merchantCapabilities,
    supportedNetworks,
  } = await applepay.config();

  if (!isEligible) {
    throw new Error("applepay is not eligible");
  }

  document.getElementById("applepay-container").innerHTML =
    '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en">';

  document.getElementById("btn-appl").addEventListener("click", onClick);

  async function onClick() {
    const paymentRequest = {
      countryCode,
      currencyCode: "USD",
      merchantCapabilities,
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
      requiredBillingContactFields: ["name", "phone", "email", "postalAddress"],
      requiredShippingContactFields: [
        "postalAddress",
        "name",
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
        amount: "108.00",
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
          session.completeMerchantValidation(payload.merchantSession);
          console.log("Complete Merchant validation Done !", { payload });
        })
        .catch((err) => {
          console.error(err);
          session.abort();
        });
    };

    session.onpaymentmethodselected = (event) => {
      session.completePaymentMethodSelection({
        newTotal: paymentRequest.total,
        newLineItems: paymentRequest.lineItems,
      });
    };

    session.onshippingcontactselected = async (event) => {
      console.log(
        "Your shipping contacts selected is:" + event.shippingContact
      );

      /*
       * US Shipping only - example of error handling
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

      const { postalCode } = event.shippingContact;

      const { newShippingMethods, taxRate } = await calculateShipping(
        postalCode
      );

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
      console.log("Your shipping method selected is:", event.shippingMethod);

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
        const order = {
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: paymentRequest.total.amount,
                breakdown: {
                  item_total: {
                    currency_code: "USD",
                    value: paymentRequest.lineItems[0].amount,
                  },
                  tax_total: {
                    currency_code: "USD",
                    value: paymentRequest.lineItems[1].amount,
                  },
                  shipping: {
                    currency_code: "USD",
                    value: paymentRequest.lineItems[2].amount,
                  },
                },
              },
              payee: {
                merchant_id: "LM7TUQJVSUPRQ",
              },
            },
          ],
        };

        /* Create Order on the Server Side */
        const orderResonse = await fetch(`/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(order),
        });
        if (!orderResonse.ok) {
          throw new Error("error creating order");
        }

        const { id } = await orderResonse.json();

        /**
         * Confirm Payment
         */
        await applepay.confirmOrder({
          orderId: id,
          token: event.payment.token,
          billingContact: event.payment.billingContact,
          shippingContact: event.payment.shippingContact,
        });

        /*
         * Capture order (must currently be made on server)
         */
        await fetch(`/capture/${id}`, {
          method: "POST",
        });

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

    session.oncancel = (event) => {
      console.log(event);
      console.log("Apple Pay Cancelled !!");
    };

    session.begin();
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOMContentLoaded");

  if (
    ApplePaySession?.supportsVersion(4) &&
    ApplePaySession?.canMakePayments()
  ) {
    setupApplepay().catch(console.log);
  }
});

