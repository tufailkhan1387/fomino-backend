require("dotenv").config();
const axios = require("axios");
const {} = require("../models");
const { v4: uuidv4 } = require("uuid");

const apiKey =
  "AQEyhmfxLY7MYhxFw0m/n3Q5qf3Ve4JKBIdPW21YyXSkmW9OjdSfqGOv8cMc3yb6ZGJ2VbQQwV1bDb7kfNy1WIxIIkxgBw==-VqTivhbxpvY5+2ta4JEVhgUgPY0IKbxnw0NS8stIsHI=-i1iW@z33#+;L7m9K_jx";
const merchantAccount = "SigitechnologiesECOM";
const paymentLinks = "https://checkout-test.adyen.com/v71/paymentLinks";
// Set up the client and service.
// Initialize the Adyen client
const { Client, CheckoutAPI } = require("@adyen/api-library");
// Initialize the client object
// For the live environment, additionally include your liveEndpointUrlPrefix.
const client = new Client({ apiKey: apiKey, environment: "TEST" });
const checkout = new CheckoutAPI(client);
const paymentStore = {};
const ApiResponse = require("../helper/ApiResponse");


async function paymentByDropIn(req, res) {
  const idempotencyKey = uuidv4();
  const { selectedPaymentMethod, recurringDetailReference, storeCard } = req.body;
  console.log(req.body)
  const shopperReference = "5096"; // Replace with a unique shopper ID from your database

  try {
    // Retrieve stored payment methods
    const storedPaymentMethods = await retrieveStoredPaymentMethods(shopperReference);
    console.log("Stored Payment Methods:", storedPaymentMethods);

    // Unique reference for the transaction
    const orderRef = uuidv4();

    console.log("Received payment request for orderRef: " + orderRef);

    // Construct the payment session request payload
    const payload = {
      amount: { currency: "EUR", value: 10000 }, // Example amount
      reference: orderRef,
      merchantAccount: merchantAccount, // Replace with your merchant account
      returnUrl: `http://localhost:3000/`,
      countryCode: "NL",
      shopperLocale: "nl-NL",
      shopperReference: shopperReference,
      recurringProcessingModel: "CardOnFile", // Specify the recurring processing model
      storePaymentMethod: storeCard ? true :false, // Ensure the payment method is stored based on checkbox
      lineItems: [
        { quantity: 1, amountIncludingTax: 5000, description: "Sunglasses" },
        { quantity: 1, amountIncludingTax: 5000, description: "Headphones" },
      ],
    };

    // Add payment method details if a recurringDetailReference is provided
    if (recurringDetailReference) {
      payload.paymentMethod = {
        type: "scheme",
        storedPaymentMethodId: recurringDetailReference,
      };
    }

    console.log("Request payload:", JSON.stringify(payload, null, 2));

    // Make the request to Adyen API
    const response = await axios.post('https://checkout-test.adyen.com/v71/sessions', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey, // Replace with your API key
        'Idempotency-Key': idempotencyKey,
      }
    });

    // Save transaction details or update payment status as needed
    paymentStore[orderRef] = {
      amount: { currency: "EUR", value: 10000 }, // Note: Value should match the amount specified in the request
      paymentRef: orderRef,
      status: "Pending",
    };

    // Attach the selected payment method to the session response
    res.json({ sessionData: response.data, selectedPaymentMethod, storedPaymentMethods });
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.response?.data?.errorCode}`);
    if (err.response) {
      console.error("Response data:", err.response.data);
      console.error("Response status:", err.response.status);
    }
    res.status(err.response?.status || 500).json(err.response?.data || { message: err.message });
  }
}



async function getPaymentMethods(req, res) {
  let obj = {
    merchantAccount: merchantAccount,
    countryCode: "NL",
    shopperLocale: "nl-NL",
    amount: {
      currency: "EUR",
      value: 1000,
    },
  };
  try {
    const idempotencyKey = uuidv4();
    let apiUrl = "https://checkout-test.adyen.com/v71/paymentMethods";
    const response = await axios.post(apiUrl, obj, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
        "Idempotency-Key": idempotencyKey,
      },
    });

    console.log("Payment Methods Response:", response.data);

    // Simplify the response to include only names and types
    const simplifiedPaymentMethods = response.data.paymentMethods.map(method => ({
      name: method.name,
      type: method.type,
    }));
    let respp = ApiResponse("1","Payment methods","",{simplifiedPaymentMethods});
    
    return res.json(respp);
  } catch (error) {
    let respp = ApiResponse("0",error.message,"Error",{});
    return res.json(respp);
  }
}


async function retrieveStoredPaymentMethods(shopperReference) {
  const apiUrl =
    "https://pal-test.adyen.com/pal/servlet/Recurring/v71/listRecurringDetails";

  const requestData = {
    merchantAccount: merchantAccount,
    recurring: {
      contract: "RECURRING",
    },
    shopperReference: shopperReference,
  };

  try {
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    console.log("Stored Payment Methods:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error retrieving stored payment methods:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function adyenPaymentbyCard(req, res) {
  const idempotencyKey = uuidv4();
  const shopperReference = "5096"; // Unique reference for the shopper

  // Retrieve stored payment methods (optional for verification, not used in payment link creation)
  let storedPaymentMethods;
  try {
    storedPaymentMethods = await retrieveStoredPaymentMethods(shopperReference);
    console.log("Stored Payment Methods:", storedPaymentMethods);
  } catch (error) {
    console.error("Error retrieving stored payment methods:", error);
    // Proceed without blocking if retrieval fails
  }

  const paymentLinkData = {
    amount: {
      currency: "USD",
      value: 1000,
    },
    reference: "023842342",
    returnUrl: "https://your-company.com/...",
    merchantAccount: merchantAccount,
    description: "Payment for order #123122313",
    expiresAt: new Date(
      new Date().getTime() + 24 * 60 * 60 * 1000
    ).toISOString(), // Link expires in 24 hours
    countryCode: "US",
    shopperEmail: "tufailkhan5096@gmail.com",
    shopperLocale: "en-US",
    allowedPaymentMethods: [], // Optional, include only if you want to restrict payment methods
    blockedPaymentMethods: [], // Optional
    reusable: false, // Optional, set to true if the link can be reused
    storePaymentMethodMode: "enabled", // Store the payment method
    recurringProcessingModel: "CardOnFile", // Recurring processing model
    shopperReference: shopperReference, // Add shopper reference
  };

  try {
    const response = await axios.post(paymentLinks, paymentLinkData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
        "Idempotency-Key": idempotencyKey,
      },
    });

    console.log("Payment Link Response:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error(
      "Payment Link Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({ error: error.message });
  }
}

async function paymentWithStoredCard(req, res) {
  const idempotencyKey = uuidv4();
  const { storedPaymentMethodId, cvc } = req.body;
  const shopperReference = "5096"; // Replace with a unique shopper ID from your database

  try {
    // Unique reference for the transaction
    const orderRef = uuidv4();

    console.log("Received payment request for orderRef: " + orderRef);

    // Construct the payment request payload
    const payload = {
      amount: { currency: "USD", value: 987654 }, // Example amount
      reference: orderRef,
      merchantAccount: merchantAccount, // Replace with your merchant account
      returnUrl: `http://localhost:3000/`,
      countryCode: "NL",
      shopperLocale: "nl-NL",
      shopperReference: shopperReference,
      recurringProcessingModel: "CardOnFile", // Specify the recurring processing model
      paymentMethod: {
        type: "scheme",
        storedPaymentMethodId: storedPaymentMethodId,
        cvc: cvc,
      },
      lineItems: [
        { quantity: 1, amountIncludingTax: 5000, description: "Sunglasses" },
        { quantity: 1, amountIncludingTax: 5000, description: "Headphones" },
      ],
    };

    console.log("Request payload:", JSON.stringify(payload, null, 2));

    // Make the request to Adyen API
    const response = await axios.post('https://checkout-test.adyen.com/v71/payments', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey, // Replace with your API key
        'Idempotency-Key': idempotencyKey,
      }
    });

    if (response.data.resultCode === 'Authorised') {
      console.log("Payment Response:", response.data);
      return res.json({ status: true, message: "Payment successful", data: response.data });
    } else {
      return res.json({ status: false, message: response.data.refusalReason || "Payment not authorised", data: response.data });
    }
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.response?.data?.errorCode}`);
    if (err.response) {
      console.error("Response data:", err.response.data);
      console.error("Response status:", err.response.status);
    }
    return res.status(err.response?.status || 500).json({ status: false, message: err.response?.data?.message || err.message });
  }
}

module.exports = {
  adyenPaymentbyCard,
  paymentByDropIn,
  getPaymentMethods,
  paymentWithStoredCard
};
