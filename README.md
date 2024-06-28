Clone the repository
git clone https://github.com/yourusername/invoice-generator-api.git
cd invoice-generator-api

Install dependencies

bash
Copy code
npm install
Configure environment variables

Create a .env file in the root directory and add your Zoho credentials and other configuration details:

ZOHO_REFRESH_TOKEN=your_refresh_token,
ZOHO_CLIENT_ID=your_client_id,
ZOHO_CLIENT_SECRET=your_client_secret,
ZOHO_ORGANIZATION_ID=your_organization_id,
PORT=5000

Start the application
npm start

API Endpoints
Create Invoice
URL: /create-invoice
Method: POST

Description: Generates a PDF invoice with the provided details.

Request Body: json 
Response: PDF file of the generated invoice.
