/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: "USD",
        value: "13.00",
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: "10.00",
          },
          tax_total: {
            currency_code: "USD",
            value: "1.00",
          },
          shipping: {
            currency_code: "USD",
            value: "2.00",
          },
        },
      },
      shipping: {
        options: [
          {
            id: "SHIP_123",
            label: "1-3 Day",
            type: "SHIPPING",
            selected: true,
            amount: {
              value: "2.00",
              currency_code: "USD",
            },
          },
          {
            id: "SHIP_456",
            label: "3-6 Day",
            type: "SHIPPING",
            selected: false,
            amount: {
              value: "1.00",
              currency_code: "USD",
            },
          }
        ],
      },
    },
  ],
};

async function calculateShipping(shippingAddress) {
  const res = await fetch("/calculate-shipping", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shippingAddress,
    }),
  });

  const { taxRate } = await res.json();

  // based on zipcode change
  return {
    taxRate,
  };
}

paypal
  .Buttons({
    fundingSource: paypal.FUNDING.APPLEPAY,
    style: {
      label: "pay",
      color: "black",
    },
    paymentRequest: {
      applepay: {
        requiredShippingContactFields: [
          "postalAddress",
          "name",
          "phone",
          "email",
        ],
      },
    },
    createOrder(data, actions) {
      logResponse("Order Payload:", order);
      return actions.order.create(order);
    },
    onError(err) {
      logResponse("onError", err.message);
    },
    onApprove(data, actions) {
      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then((dataCapt) => {
          logResponse("Capture -", dataCapt);

          fetch(`/orders/${data.orderID}`)
          .then(res => res.json())
          .then(data => {
            logResponse("GET Order", data);
          })

        })
        .catch((err) => {
          alert(`Order Capture Error - OrderID ${data.orderID}`);
          console.error(err);
        });
    },
    onShippingChange(data, actions) {
      const { amount, shipping } = order.purchase_units[0];

      logResponse("onShippingChange data", data);

      return calculateShipping(data.shipping_address)
        .then(({ taxRate }) => {
          const itemTotal = parseFloat(amount.breakdown.item_total.value);

          const shippingMethodAmount = parseFloat(
            data.selected_shipping_option.amount.value
          );

          const taxTotal = parseFloat(taxRate) * itemTotal;

          const purchaseUnitsAmount = {
            currency_code: amount.currency_code,
            value: (itemTotal + taxTotal + shippingMethodAmount).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: amount.currency_code,
                value: itemTotal.toFixed(2),
              },
              tax_total: {
                currency_code: amount.currency_code,
                value: taxTotal.toFixed(2),
              },
              shipping: {
                currency_code: amount.currency_code,
                value: shippingMethodAmount.toFixed(2),
              },
            },
          };

          const shippingOptions = (shipping?.options || []).map((option) => ({
            ...option,
            selected: option.id === data.selected_shipping_option.id,
          }));

          logResponse("onShippingChange PATCH", [
            {
              op: "replace",
              path: "/purchase_units/@reference_id=='default'/shipping/options",
              value: shippingOptions,
            },
            {
              op: "replace",
              path: "/purchase_units/@reference_id=='default'/amount",
              value: purchaseUnitsAmount,
            },
          ]);

          // must return promise
          return fetch(`/orders/${data.orderID}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              // info: https://developer.paypal.com/api/orders/v2/#orders_patch

              /*
               * Shipping Options
               */
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/shipping/options",
                value: shippingOptions,
              },

              /*
               * Order Amount
               */
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/amount",
                value: purchaseUnitsAmount,
              },
            ]),
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error("patching order");
              }
              return actions.resolve();
            })
            .catch((err) => {
              console.error(err);
              return actions.reject(err);
            });
        })
        .catch(console.error);
    },
  })
  .render("#applepay-btn");


  function logResponse(title, response) {
    const formattedResponse = document.createElement("pre");
    formattedResponse.style.marginBottom = "3rem"
  
    const code = document.createElement("code");
    code.classList.add("language-json");
  
    formattedResponse.appendChild(code);
  
    const formattedTitle = document.createElement("h6");
    formattedTitle.style.marginLeft = "1rem"
  
    code.appendChild(
      document.createTextNode(JSON.stringify(response, null, 2))
    );
  
    formattedTitle.appendChild(document.createTextNode(title));
  
    document
      .getElementById("logging")
      .insertAdjacentElement("afterend", formattedResponse);
  
    document
      .getElementById("logging")
      .insertAdjacentElement("afterend", formattedTitle);
  /*
      // eslint-disable-next-line
      hljs.configure({
        ignoreUnescapedHTML: true
      });
  
      // eslint-disable-next-line
      hljs.highlightAll();
      */
  }