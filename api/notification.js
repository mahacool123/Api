const express = require('express');
const router = express.Router();
const ClientSchemas = require('../schema/Client');
const moment = require('moment-timezone');
// Handler for adding notifications
const addNotificationHandler = (io) => {
    return async (req, res) => {
        try {
            const { customerID, message, weight, dryFruitName } = req.body;

            // Validate inputs
            if (!/^\d{6}$/.test(customerID)) {
                return res.status(400).json({ error: 'Invalid customerID. It must be a 6-digit number.' });
            }
            if (!message || typeof message !== 'string') {
                return res.status(400).json({ error: 'Invalid message. It must be a non-empty string.' });
            }
            if (typeof weight !== 'number' || weight <= 0) {
                return res.status(400).json({ error: 'Invalid weight. It must be a positive number.' });
            }
            if (!dryFruitName || typeof dryFruitName !== 'string') {
                return res.status(400).json({ error: 'Invalid dryFruitName. It must be a non-empty string.' });
            }

            // Find customer
            let customer = await ClientSchemas.findOne({ customerID });
            if (!customer) {
                return res.status(404).json({ error: 'Client not found.' });
            }

            // Add notification with current date and time in Indian time zone
            const notification = {
                message,
                weight,
                dryFruitName,
                date: moment().tz('Asia/Kolkata').format() // Capture current date and time in Indian time zone
            };

            if (!Array.isArray(customer.notification)) {
                customer.notification = [];
            }
            customer.notification.push(notification);
            await customer.save();

            // Emit notification
            console.log('Adding notification to customer');
            console.log('Emitting new notification to clients');
            io.emit('new-notification', notification); // Emit the notification

            res.status(200).json({ message: 'Notification added successfully', customer });
        } catch (error) {
            console.error('Error occurred while adding the notification:', error);
            res.status(500).json({ error: 'An error occurred while adding the notification' });
        }
    };
};
// Route for getting notifications
router.get('/get-notifications', async (req, res) => {
    try {
        const { customerID } = req.query;

        if (!customerID) {
            return res.status(400).json({ error: 'CustomerID is required.' });
        }

        const customer = await ClientSchemas.findOne({ customerID });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found.' });
        }

        // Ensure notifications are sorted by date in descending order
        const sortedNotifications = customer.notification.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(sortedNotifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching notifications.' });
    }
});


// Export the router with io
module.exports = (io) => {
    router.post('/add-notification', addNotificationHandler(io));
    return router;
};
