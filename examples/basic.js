/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: "USD",
        value: "7.05",
      },
    },
  ],
};

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
    onCancel() {
      logResponse("onCancel called", {});
    },
    createOrder(data, actions) {
      logResponse("Order Payload:", order);
      return actions.order.create(order);
    },
    onApprove(data, actions) {
      console.log("Order approved")
      logResponse("Approved:", data);

      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then((dataCapt) => {
          logResponse("Capture:", dataCapt);

          fetch(`/orders/${data.orderID}`)
          .then(res => res.json())
          .then(data => {
            logResponse("GET Order", data);
          })

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