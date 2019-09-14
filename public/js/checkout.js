const stripe = Stripe("pk_test_TDmyBMqOyB2sVTpYjB35Ne3V00nOfoeYzT");
const stripePaymentButton = document.getElementById("stripePaymentButton");
const checkoutSessionId = stripePaymentButton.getAttribute("checkoutSessionId");

setTimeout(() => {
  checkoutWithStripe();
}, 2000);

const checkoutWithStripe = elem => {
  return stripe
    .redirectToCheckout({
      // Make the id field from the Checkout Session creation API response
      // available to this file, so you can provide it as parameter here
      // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: checkoutSessionId
    })
    .then(result => {
      console.log(result);
      // fetch("/orders/:orderId", {method: "POST"})

      // If `redirectToCheckout` fails due to a browser or network
      // error, display the localized error message to your customer
      // using `result.error.message`.
    });
};
