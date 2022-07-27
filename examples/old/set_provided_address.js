/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: "USD",
        value: "0.01",
      },
      shipping: {
        name: {
          full_name: "John Doe",
        },
        address: {
          address_line_1: "123 FROM ORDER CREATE",
          address_line_2: "Floor 6",
          admin_area_1: "CA",
          admin_area_2: "San Francisco",
          postal_code: "94107",
          country_code: "US",
        },
      },
    },
  ],
  application_context: {
    shipping_preference: "SET_PROVIDED_ADDRESS",
  },
};

paypal
  .Buttons({
    fundingSource: paypal.FUNDING.APPLEPAY,
    style: {
      label: "pay",
      color: "black",
    },
    createOrder(data, actions) {
      return actions.order.create(order);
    },
    async onApprove(data, actions) {
      console.log("Order approved");

      logResponse(
        "GET before capture:",
        await fetch(`/orders/${data.orderID}`).then((res) => res.json())
      );

      const captureResponse = await fetch(`/capture/${data.orderID}`, {
        method: "post",
      }).then((res) => res.json());

      logResponse("Capture:", captureResponse);

      logResponse(
        "GET after capture:",
        await fetch(`/orders/${data.orderID}`).then((res) => res.json())
      );
    },
    onError(err) {
      logResponse("onError:", err);
    },
  })
  .render("#applepay-btn");

function logResponse(title, response) {
  const formattedResponse = document.createElement("pre");
  const formattedTitle = document.createElement("h6");

  formattedResponse.appendChild(
    document.createTextNode(JSON.stringify(response, null, 2))
  );

  formattedTitle.appendChild(document.createTextNode(title));

  document
    .getElementById("logging")
    .insertAdjacentElement("afterend", formattedResponse);

  document
    .getElementById("logging")
    .insertAdjacentElement("afterend", formattedTitle);
}
