/* eslint-disable  no-alert, no-unused-vars, no-undef */


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
  const applepay = paypal.Applepay();
    const {
      isEligible,
      countryCode,
      currencyCode,
      merchantCapabilities,
      supportedNetworks,
    } = await  applepay.config();

  if (!isEligible) {
    throw new Error("applepay is not eligible");
  }

  document.getElementById("applepay-container").innerHTML =
    '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en">';

  document.getElementById("btn-appl").addEventListener("click", onClick);

  async function onClick() {
    console.log({ merchantCapabilities, currencyCode, supportedNetworks })

    const paymentRequest = {
      countryCode,
      currencyCode: 'USD',
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
      requiredBillingContactFields: [
        "name",
        "phone",
        "email",
        "postalAddress",
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
          session.completeMerchantValidation(payload.merchantSession);
          console.log("Complete Merchant validation Done !", {payload})

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
      });
    };

    session.onshippingcontactselected = async (event) => {

      console.log("Your shipping contacts selected is:"+ event.shippingContact)
      const shippingContactUpdate = { 
        newTotal: paymentRequest.total,
        newLineItems: []
      };

      /*
       * US Shipping only
       */
      //  Commenting out temporarily to test simple integration 
      // if (event.shippingContact.countryCode !== "US") {
      //   return session.completeShippingContactSelection({
      //     errors: [
      //       new ApplePayError(
      //         "shippingContactInvalid",
      //         "postalCode",
      //         "Sorry we only ship to the US currently"
      //       ),
      //     ],
      //   });
      // }

      // console.log("onshippingcontactselected");
      // console.log(JSON.stringify(event.shippingContact, null, 4));

      // const { postalCode } = event.shippingContact;

      // const { newShippingMethods, taxRate } = await calculateShipping(postalCode);

      // const goodsItem = paymentRequest.lineItems.find(
      //   (item) => item.label === "Goods"
      // );

      // const newLineItems = [
      //   { ...goodsItem },
      //   {
      //     label: "Shipping",
      //     amount: newShippingMethods[0]?.amount,
      //   },
      //   {
      //     label: "Sales Tax",
      //     amount: (taxRate * parseFloat(goodsItem.amount)).toFixed(2),
      //   },
      // ];

      // const totalAmount = newLineItems.reduce(
      //   (total, item) => total + parseFloat(item.amount),
      //   0
      // );

      // console.log(
      //   JSON.stringify(
      //     { totalAmount, newLineItems, newShippingMethods },
      //     null,
      //     4
      //   )
      // );

      // const newTotal = {
      //   label: "Demo (Card is not charged)",
      //   amount: totalAmount.toFixed(2),
      //   type: "final",
      // };

      // const shippingContactUpdate = {
      //   newTotal,
      //   newLineItems,
      //   newShippingMethods,
      //   errors: [],
      // };

      // Object.assign(paymentRequest, {
      //   lineItems: newLineItems,
      //   total: newTotal,
      // });

      session.completeShippingContactSelection(shippingContactUpdate);
    };

    session.onshippingmethodselected = (event) => {
      console.log("onshippingmethodselected");
      console.log(JSON.stringify(event.shippingMethod, null, 4));
      console.log("Your shipping method selected is:", event.shippingMethod);
      
      var shippingMethodUpdate = { 
        newTotal: paymentRequest.total,
        newLineItems: []
      }; 
      
      //  Commenting out temporarily to test simple integration 
      // const newLineItems = [
      //   {
      //     ...paymentRequest.lineItems.find((item) => item.label == "Goods"),
      //   },
      //   {
      //     ...paymentRequest.lineItems.find((item) => item.label == "Sales Tax"),
      //   },
      //   {
      //     label: "Shipping",
      //     amount: event.shippingMethod.amount,
      //   },
      // ];

      // let totalAmount = newLineItems.reduce(
      //   (total, item) => total + parseFloat(item.amount),
      //   0
      // );

      // const newTotal = {
      //   label: "Demo (Card is not charged)",
      //   amount: totalAmount.toFixed(2),
      //   type: "final",
      // };

      // const shippingMethodUpdate = {
      //   newTotal,
      //   newLineItems,
      //   errors: [],
      // };

      // Object.assign(paymentRequest, {
      //   lineItems: newLineItems,
      //   total: newTotal,
      // });

      session.completeShippingMethodSelection(shippingMethodUpdate);
    };

    session.onpaymentauthorized = async (event) => {
      try {
        console.log("onpaymentauthorized");
        console.log(JSON.stringify(event, null, 4));

        const order = {
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
        }

        /* Create Order on the Server Side */
        
        const { id } = await fetch(`/orders`,{
          method:'POST',
          headers : {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        }).then((res) => res.json());

        /**
         * Confirm Payment 
         */
        await applepay.confirmOrder({ orderId: id, token: event.payment.token, billingContact: event.payment.billingContact , shippingContact: event.payment.shippingContact });

        /*
        * Capture order (must currently be made on server)
        */
        await fetch(`/capture/${id}`, {
          method: 'POST',
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

    session.oncancel  = (event) => {
      console.log(event);
      console.log("Apple Pay Cancelled !!")
    }

    session.begin();
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOMContentLoaded");

  if(ApplePaySession?.supportsVersion(4) && ApplePaySession?.canMakePayments()) {
    setupApplepay().catch(console.log);
  }
});
