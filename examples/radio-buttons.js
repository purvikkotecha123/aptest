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
    variables: {
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSizeBase: "0.9375rem",
      fontSizeSm: "0.93rem",
      fontSizeM: "0.93rem",
      fontSizeLg: "1.0625rem",
      textColor: "#2c2e2f",
      colorTextPlaceholder: "#2c2e2f",
      colorBackground: "#fff",
      colorInfo: "#0dcaf0",
      colorDanger: "#d20000",
      borderRadius: "0.2rem",
      borderColor: "#dfe1e5",
      borderWidth: "1px",
      borderFocusColor: "black",
      spacingUnit: "10px",
    },
    rules: {
      ".Input": {},
      ".Input:hover": {},
      ".Input:focus": {
      },
      ".Input:active": {},
      ".Input--invalid": {},
      ".Label": {},
      ".Error": {
        marginTop: '2px',
      },
    },
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
        break;
      case "ideal":
        document.getElementById("ideal-fields").style.display = "block";
        document.getElementById("ideal-btn").style.display = "block";
        document.getElementById("paypal-btn").style.display = "none";
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