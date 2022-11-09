/* eslint-disable  no-alert, no-unused-vars, no-undef */


/*
 * Merchant integration - basic amount with breakdwon 
 */

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

    const paymentRequest = {
      countryCode,
      currencyCode: 'USD',
      merchantCapabilities,
      supportedNetworks,
      requiredBillingContactFields: [
        "name",
        "phone",
        "email",
        "postalAddress",
      ],
      requiredShippingContactFields: [
      ],
      total: {
        label: "Demo (Card is not charged)",
        amount: "108.00",
        type: "final",
      },
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
    };
    

    var session = new ApplePaySession(4, paymentRequest);

    session.onvalidatemerchant = (event) => {
      applepay
        .validateMerchant({
          validationUrl: event.validationURL,
        })
        .then((payload) => {
          session.completeMerchantValidation(payload.merchantSession);
        })
        .catch((err) => {
          console.error(err);
          session.abort();
        });
    };

    session.onpaymentmethodselected = (event) => {
      session.completePaymentMethodSelection({
        newTotal: paymentRequest.total,
        newLineItems: paymentRequest.lineItems
      });
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
                merchant_id: "2V9L63AM2BYKC",
              },
            },
          ],
        }

        /* Create Order on the Server Side */
         const orderResonse = await fetch(`/orders`,{
          method:'POST',
          headers : {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        })
        if(!orderResonse.ok) {
            throw new Error("error creating order")
        }

        const { id } = await orderResonse.json()

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
      console.log("Apple Pay Cancelled !!")
    }

    session.begin();
  }
}

document.addEventListener("DOMContentLoaded", (event) => {

  if(ApplePaySession?.supportsVersion(4) && ApplePaySession?.canMakePayments()) {
    setupApplepay().catch(console.error);
  }
});
