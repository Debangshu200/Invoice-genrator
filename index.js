const express = require("express");
const axios = require("axios");
const pdf = require("html-pdf");
const path = require("path");
const num2words = require("num2words");
require("dotenv").config();

const app = express();
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join("./views/invoice.ejs", "views"));
app.use(express.static(path.join("./assets/logo.png", "public")));

//to get Zoho access token
const getZohoAccessToken = async () => {
  const response = await axios.post(
    "https://accounts.zoho.com/oauth/v2/token",
    null,
    {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
      },
    }
  );
  return response.data.access_token;
};

//endpoint to create the invoice
app.post("/create-invoice", async (req, res) => {
  const {
    sellerDetails,
    supplyPlace,
    billingDetails,
    shippingDetails,
    deliveryPlace,
    orderDetails,
    invoiceDetails,
    reverseCharge,
    items,
    signatureImagePath,
  } = req.body;

  try {
    //get access token
    const accessToken = await getZohoAccessToken();
    const invoiceData = {
      //prepare invoice data
      customer_name: billingDetails.name,
      reference_number: orderDetails.orderNo,
      date: invoiceDetails.invoiceDate,
      line_items: items.map((item) => ({
        name: item.description,
        rate: item.unit_price,
        quantity: item.quantity,
        discount: item.discount || 0,
      })),
      place_of_supply: supplyPlace,
      gst_treatment: "business_gst",
      gst_no: billingDetails.gst_no,
      is_reverse_charge_applied: reverseCharge.toLowerCase() === "yes",
    };

    //send invoice data to zoho api
    const zohoResponse = await axios.post(
      "https://www.zohoapis.com/invoice/v3/invoices",
      invoiceData,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
          "X-com-zoho-invoice-organizationid": process.env.ZOHO_ORGANIZATION_ID,
        },
      }
    );
    // to generate pdf
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    //remove invoice HTML using EJS template
    const renderedHTML = await app.render("invoice", {
      sellerDetails,
      supplyPlace,
      billingDetails,
      shippingDetails,
      deliveryPlace,
      orderDetails,
      invoiceDetails,
      reverseCharge,
      items,
      signatureImagePath,
      total: zohoResponse.data.invoice.total,
      totalInWords: num2words(zohoResponse.data.invoice.total),
    });

    await page.setContent(renderedHtml);

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${orderDetails.orderNo}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the Invoice Generator API");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
