/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: "EUR",
        value: "7.05",
      },
    },
  ],
};

/* ApplePay */
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
    onApprove(data, actions) {
      console.log("Order approved")

      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(JSON.stringify(data, null, 4))
          alert("order captured")
        })
        .catch(console.error);
    },
  })
  .render("#applepay-btn");

/* Paypal */
paypal
  .Marks({
    fundingSource: paypal.FUNDING.PAYPAL,
  })
  .render("#paypal-mark");

paypal
  .Buttons({
    fundingSource: paypal.FUNDING.PAYPAL,
    style: {
      label: "pay"
    },
    createOrder(data, actions) {
      return actions.order.create(order);
    },
    onApprove(data, actions) {
      console.log("Order approved")

      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(JSON.stringify(data, null, 4))
          alert("order captured")
        })
        .catch(console.error);
    },
  })
  .render("#paypal-btn");

/* iDEAL  */
paypal
  .Marks({
    fundingSource: paypal.FUNDING.IDEAL,
  })
  .render("#ideal-mark");

paypal
.PaymentFields({
  fundingSource: paypal.FUNDING.IDEAL,
  style: {
  },
  fields: {
    name: {
      value: "",
    },
  },
})
.render("#ideal-fields");

paypal
  .Buttons({
    fundingSource: paypal.FUNDING.IDEAL,
    style: {
      label: "pay"
    },
    createOrder(data, actions) {
      return actions.order.create(order);
    },
    onApprove(data, actions) {
      console.log("Order approved")

      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(JSON.stringify(data, null, 4))
          alert("order captured")
        })
        .catch(console.error);
    },
  })
  .render("#ideal-btn");

document.getElementById("applepay-btn").style.display = "none";
document.getElementById("ideal-btn").style.display = "none";
document.getElementById("ideal-fields").style.display = "none";

/* radio buttons */
document.querySelectorAll("input[name=payment-option]").forEach((el) => {
  el.addEventListener("change", (event) => {
    switch (event.target.value) {
      case "paypal":
        document.getElementById("ideal-fields").style.display = "none";
        document.getElementById("ideal-btn").style.display = "none";
        document.getElementById("paypal-btn").style.display = "block";
        document.getElementById("applepay-btn").style.display = "none";

        break;
      case "ideal":
        document.getElementById("ideal-fields").style.display = "block";
        document.getElementById("ideal-btn").style.display = "block";
        document.getElementById("paypal-btn").style.display = "none";
        document.getElementById("applepay-btn").style.display = "none";
        break;
      case "applepay":
          document.getElementById("ideal-fields").style.display = "none";
          document.getElementById("ideal-btn").style.display = "none";
          document.getElementById("paypal-btn").style.display = "none";
          
          document.getElementById("applepay-btn").style.display = "block";

          break;
      default:
        break;
    }
  });
});