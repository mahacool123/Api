const express = require('express');
const router = express.Router();
const Client = require('../schema/Client');  // Import the Client model

// Route to accept base64 encoded file and push it to a client's file array
router.post('/uploadBase64/:customerID', async (req, res) => {
    console.log(req.body)
    const customerID = req.params.customerID;
    const { base64File, fileName, mimeType } = req.body;  // Expecting file data in the request body

    if (!base64File || !fileName || !mimeType) {
        return res.status(400).send({ message: 'Missing file data or metadata' });
    }

    try {
        // Find the client by customerID
        let client = await Client.findOne({ customerID: customerID });

        if (!client) {
            return res.status(404).send({ message: 'Client not found' });
        }

        // Push the base64 file info into the client's file array
        client.file.push({
            base64: base64File,
            filename: fileName,
            mimetype: mimeType,
            uploadedAt: new Date()
        });

        // Save the updated client document
        await client.save();

        res.status(200).send({ message: 'Base64 file uploaded and data updated successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error uploading Base64 file', error: error.message });
    }
});

module.exports = router;
