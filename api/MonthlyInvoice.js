const express = require('express');
const router = express.Router();
const MonthlyInvoice = require('../schema/MonthlyInvoice');
const { ClientSchemas } = require('../schema/Client');
const multer = require('multer');
const { uploadPDFToFirebase } = require('../firebase');

const upload = multer();

const puppeteer = require('puppeteer');
const generatePDF = async (htmlContent) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    await page.setContent(htmlContent); // Set HTML content
  
    // Generate the PDF, allowing Puppeteer to determine the size based on the content
    const pdfBuffer = await page.pdf({
      printBackground: true,  // Ensure background images and colors are included
    });
  
    await browser.close();
    return pdfBuffer;
  };

// Function to handle PDF upload and client update
const handlePDFUpload = async (clientId, htmlContent) => {
    try {
        const pdfBuffer = await generatePDF(htmlContent);
        const pdfUrl = await uploadPDFToFirebase(pdfBuffer);

        const client = await ClientSchemas.findOne({ customerID: clientId });
        if (!client) {
            throw new Error('Client not found');
        }

        client.fileUrls.push({ url: pdfUrl, date: new Date().toISOString() });
        await client.save();
        return pdfUrl; // Return the URL for the response
    } catch (error) {
        console.error('Error in handlePDFUpload:', error.message);
        throw error; // Rethrow to handle in the caller function
    }
};

// Route to handle HTML to PDF conversion and Firebase upload


// Route to update paid totals
router.post('/updatePaidTotals/:customerId', async (req, res) => {
    const { customerId } = req.params;
    const { paidGrandTotalAmounts } = req.body;

    // Validate input
    if (!paidGrandTotalAmounts || paidGrandTotalAmounts <= 0) {
        console.log('Invalid input for paidGrandTotalAmounts:', paidGrandTotalAmounts);
        return res.status(400).json({ message: 'Invalid paidGrandTotalAmounts. It must be greater than zero.' });
    }

    try {
        // Find the customer by customer ID
        const customer = await ClientSchemas.findOne({ customerID: customerId });
        if (!customer) {
            console.log(`Customer not found for Customer ID: ${customerId}`);
            return res.status(404).json({ message: `Customer not found for Customer ID: ${customerId}` });
        }

        // Find the invoice by customer ID
        const invoice = await MonthlyInvoice.findOne({ customerId });
        if (!invoice) {
            console.log(`Invoice not found for Customer ID: ${customerId}`);
            return res.status(404).json({ message: `Invoice not found for Customer ID: ${customerId}` });
        }

        // Push the new payment to the paidGrandTotalAmounts array
        const paymentDate = new Date();
        invoice.paidGrandTotalAmounts.push({ amount: paidGrandTotalAmounts, date: paymentDate });
        await invoice.processPayments(); 
        // Calculate totals
        const totalPaidAmount = invoice.paidGrandTotalAmounts.reduce((total, payment) => total + payment.amount, 0);
        const grandTotalAmount = invoice.grandTotalAmount;
        const unpaidRemainingAmount = grandTotalAmount - totalPaidAmount;

        // Prepare HTML content for PDF generation
        const htmlContent = `
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; padding: 0; background-color: #f4f4f4; }
                .invoice-container { background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .invoice-header { text-align: center; margin-bottom: 20px; }
                .logo { width: 80px; height: auto; }
                h2 { margin: 0; }
                .contact-details, .company-details { text-align: center; margin: 10px 0; }
                .customer-details { margin-top: 20px; border: 1px solid #ddd; border-radius: 5px; padding: 10px; }
                .invoice-details { margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                h1 { font-size: 24px; text-align: center; margin-bottom: 20px; }
                p { margin: 5px 0; font-size: 16px; }
                .total { font-weight: bold; font-size: 18px; }
                .payment-info { margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
            <div class="invoice-container">
                <div class="invoice-header">
                    <img src="https://firebasestorage.googleapis.com/v0/b/mahacool-5b59f.appspot.com/o/icons%2Fmahacool%20app%20icon%20basic.jpg?alt=media&token=ad59b58c-a3ea-4e83-81de-dbc737b70225" alt="Company Logo" class="logo" />
                    <h2 class="company-name">www.mahacool.com</h2>
                    <div class="contact-details">
                        <p>Email: gaurav@anakeen.net</p>
                        <p>Direct Line: +91-9818647283</p>
                    </div>
                    <div class="company-details">
                        <p>GSTN: 07AHFPA6877M1ZW</p>
                        <p>2317/30, Gali Hinga Beg, Tilak Bazar, Khari Baoli, New Delhi, 110018</p>
                    </div>
                </div>
                <h1>Invoice Details for Customer ID: ${customerId}</h1>
                <div class="customer-details">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${customer.name}</p>
                    <p><strong>Business Name:</strong> ${customer.bussinessName}</p>
                    <p><strong>Email:</strong> ${customer.email}</p>
                    <p><strong>Mobile:</strong> ${customer.mobile}</p>
                    <p><strong>Address:</strong> ${customer.address}</p>
                    <p><strong>GST Number:</strong> ${customer.gstNumber || 'N/A'}</p>
                </div>
                <div class="invoice-details">
                    <h3>Invoice Summary</h3>
                    <p><strong>Paid Amount:</strong> ${paidGrandTotalAmounts.toFixed(2)}</p>
                    <p class="total"><strong>Total Paid Amount:</strong> ${totalPaidAmount.toFixed(2)}</p>
                    <p class="total"><strong>Grand Total Amount with 18% Gst:</strong> ${grandTotalAmount.toFixed(2)}</p>
                    <p class="total"><strong>Unpaid Remaining Amount:</strong> ${unpaidRemainingAmount.toFixed(2)}</p>
                </div>
                <div class="payment-info">
                    <h3>Payment Details</h3>
                    <p><strong>Payment Date:</strong> ${paymentDate.toLocaleDateString()}</p>
                </div>
            </div>
        `;

        // Call the handlePDFUpload function
        const pdfUrl = await handlePDFUpload(customerId, htmlContent);

        // Save the updated invoice
        await invoice.save();

        res.status(200).json({ message: 'Paid totals updated successfully', pdfUrl, paidGrandTotalAmounts });
    } catch (error) {
        console.error(`Error updating paid totals for Customer ID: ${customerId}`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/upload/:clientId', upload.single('file'), async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const file = req.file;

        if (!file) {
            return res.status(400).send('No file uploaded');
        }

        const htmlContent = file.buffer.toString();
        const pdfUrl = await handlePDFUpload(clientId, htmlContent);

        res.status(200).json({ msg: 'PDF uploaded successfully', pdfUrl });
    } catch (error) {
        console.error('Error occurred in /upload:', error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/getAll', async (req, res) => {
    try {
        const invoices = await MonthlyInvoice.find({});
        if (invoices.length === 0) {
            return res.status(404).json({ message: 'No invoices found' });
        }
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching all invoices:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 2. Route to get invoice by customerId
router.get('/getByCustomerId/:customerId', async (req, res) => {
    const { customerId } = req.params;
    
    try {
        const invoice = await MonthlyInvoice.findOne({ customerId });
        if (!invoice) {
            return res.status(404).json({ message: `Invoice not found for Customer ID: ${customerId}` });
        }
        res.status(200).json(invoice);
    } catch (error) {
        console.error(`Error fetching invoice for Customer ID: ${customerId}`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// router.post('/updatePaidTotals/:customerId', async (req, res) => {
//     const { customerId } = req.params;
//     const { paidGrandTotalAmounts } = req.body; // paid amount directly from the request

//     // Validate input
//     if (!paidGrandTotalAmounts || paidGrandTotalAmounts <= 0) {
//         return res.status(400).json({ message: 'Invalid paidGrandTotalAmounts. It must be greater than zero.' });
//     }

//     try {
//         // Find the invoice by customer ID
//         const invoice = await MonthlyInvoice.findOne({ customerId });
//         if (!invoice) {
//             return res.status(404).json({ message: `Invoice not found for Customer ID: ${customerId}` });
//         }

//         // Push the new payment to the paidGrandTotalAmounts array
//         invoice.paidGrandTotalAmounts.push({ 
//             amount: paidGrandTotalAmounts, 
//             date: new Date() 
//         });

//         // Process payments
//         await invoice.processPayments(); 

//         // Save the updated invoice
//         await invoice.save();

//         res.status(200).json({ message: 'Paid totals updated successfully', paidGrandTotalAmounts });
//     } catch (error) {
//         console.error(`Error updating paid totals for Customer ID: ${customerId}`, error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });






    



module.exports = router;



