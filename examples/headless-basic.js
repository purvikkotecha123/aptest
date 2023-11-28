/* eslint-disable  no-alert, no-unused-vars, no-undef */


/*
 * Merchant integration - basic amount
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
    console.log({ merchantCapabilities, currencyCode, supportedNetworks })

    const paymentRequest = {
    "countryCode": "US",
    "currencyCode": "USD",
    "merchantCapabilities": [
        "supports3DS",
        "supportsDebit",
        "supportsCredit"
    ],
    "shippingMethods": [
        {
            "label": "Free Standard Shipping",
            "amount": "0.00",
            "detail": "Arrives in 5-7 days",
            "identifier": "standardShipping",
            "dateComponentsRange": {
                "startDateComponents": {
                    "years": 2023,
                    "months": 12,
                    "days": 3,
                    "hours": 0
                },
                "endDateComponents": {
                    "years": 2023,
                    "months": 12,
                    "days": 5,
                    "hours": 0
                }
            }
        },
        {
            "label": "Express Shipping",
            "amount": "1.00",
            "detail": "Arrives in 2-3 days",
            "identifier": "expressShipping",
            "dateComponentsRange": {
                "startDateComponents": {
                    "years": 2023,
                    "months": 11,
                    "days": 30,
                    "hours": 0
                },
                "endDateComponents": {
                    "years": 2023,
                    "months": 12,
                    "days": 1,
                    "hours": 0
                }
            }
        }
    ],
    "shippingType": "shipping",
    "supportedNetworks": [
        "visa",
        "masterCard",
        "amex",
        "discover"
    ],
    "requiredBillingContactFields": [
        "postalAddress",
        "name"
    ],
    "requiredShippingContactFields": [
        "postalAddress",
        "name",
        "phone",
        "email"
    ],
    "lineItems": [
        {
            "label": "Sales Tax",
            "amount": "1.00"
        },
        {
            "label": "Shipping",
            "amount": "0.00"
        }
    ],
    "total": {
        "label": "Demo (Card is not charged)",
        "amount": "2.99",
        "type": "final"
    }
};
    var session = new ApplePaySession(3, paymentRequest);

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
              },
              payee: {
                merchant_id: "4JLZ2LPZ3PJJU",
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
        console.log({ id })
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
