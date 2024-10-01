const express = require("express");
const router = express.Router();
const CustomerHistory = require('../schema/CustomerHistory'); 

router.post('/customer-history', async (req, res) => {
    console.log('Received data:', req.body);
    try {
        const { customerId, checkInHistory, checkOutHistory = [] } = req.body;

        // Validate the input
        if (!/^[0-9]{6}$/.test(customerId)) {
            return res.status(400).json({ message: 'Invalid customerId. It must be a 6-digit number.' });
        }

        // Find the existing customer history or create a new one
        let customerHistory = await CustomerHistory.findOne({ customerId });
        if (!customerHistory) {
            customerHistory = new CustomerHistory({ customerId });
        }

        // Initialize or update total weight for each fruit using a Map
        const totalWeightByFruit = new Map(customerHistory.totalWeightByFruit);

        // Calculate total weight from check-in history
        checkInHistory.forEach(history => {
            history.dryFruits.forEach(dryFruit => {
                const currentTotalWeight = totalWeightByFruit.get(dryFruit.name) || 0;
                const newTotalWeight = currentTotalWeight + dryFruit.weight;
                totalWeightByFruit.set(dryFruit.name, newTotalWeight);
            });
        });

        // Convert the Map to a plain object before saving
        customerHistory.totalWeightByFruit = Object.fromEntries(totalWeightByFruit);

        // Add check-in history with IST date
        checkInHistory.forEach(history => {
            history.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        });
        customerHistory.checkInHistory.push(...checkInHistory);

        // Add check-out history (optional, empty by default)
        if (checkOutHistory.length > 0) {
            checkOutHistory.forEach(history => {
                history.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            });
            customerHistory.checkOutHistory.push(...checkOutHistory);
        }

        // Save and respond
        const savedHistory = await customerHistory.save();
        res.status(201).json(savedHistory);
    } catch (error) {
        console.error('Error in /api/customer-history:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
router.delete('/customer-history/:customerId/dryfruit/:recordId', async (req, res) => {
    const { customerId, recordId } = req.params;

    try {
        // Find the customer history by customerId
        const customerHistory = await CustomerHistory.findOne({ customerId });

        if (!customerHistory) {
            return res.status(404).json({ message: 'Customer history not found.' });
        }

        // Flag to check if a dry fruit was deleted
        let dryFruitDeleted = false;

        // Loop through the checkInHistory and remove the dry fruit with the matching recordId
        customerHistory.checkInHistory = customerHistory.checkInHistory.filter(history => {
            // Filter out the dryFruits with matching recordId
            history.dryFruits = history.dryFruits.filter(dryFruit => dryFruit.recordId !== recordId);

            // Check if any dry fruit was deleted
            if (history.dryFruits.length < 1) {
                dryFruitDeleted = true;
            }

            // Return only histories that still have dryFruits after deletion
            return history.dryFruits.length > 0;
        });

        // If no dry fruit was deleted, return a 404 error
        if (!dryFruitDeleted) {
            return res.status(404).json({ message: 'Dry fruit not found with the specified recordId.' });
        }

        // Save the updated customer history
        await customerHistory.save();
        return res.status(200).json({ message: 'Dry fruit and empty histories deleted successfully.', customerHistory });

    } catch (error) {
        console.error('Error deleting dry fruit:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});



router.get('/getAll-history', async (req, res) => {
    try {
        // Fetch all customer histories without sorting
        const histories = await CustomerHistory.find();

        // Map over the histories to create a new structure without unwanted properties
        const modifiedHistories = histories.map(history => {
            // Convert Mongoose document to a plain object
            const plainHistory = history.toObject();

            // Map over checkInHistory to clean it
            const modifiedCheckInHistory = plainHistory.checkInHistory.map(checkIn => {
                // Map over dryFruits to add customerId
                const modifiedDryFruits = checkIn.dryFruits.map(dryFruit => {
                    return {
                        name: dryFruit.name,
                        typeOfSack: dryFruit.typeOfSack,
                        weight: dryFruit.weight,
                        cityName: dryFruit.cityName,
                        warehouseName: dryFruit.warehouseName,
                        rackName: dryFruit.rackName,
                        _id: dryFruit._id,
                        dateCheckIN: dryFruit.dateCheckIN,
                        recordId: dryFruit.recordId,
                        customerId: plainHistory.customerId // Add customerId to each dry fruit
                    };
                });

                return {
                    dryFruits: modifiedDryFruits, // Keep clean structure
                    _id: checkIn._id // Include the check-in ID
                };
            });

            // Map over checkOutHistory to clean it and add customerId to dryFruits
            const modifiedCheckOutHistory = plainHistory.checkOutHistory.map(checkOut => {
                const modifiedDryFruits = checkOut.dryFruits.map(dryFruit => {
                    return {
                        name: dryFruit.name,
                        typeOfSack: dryFruit.typeOfSack,
                        weight: dryFruit.weight,
                        cityName: dryFruit.cityName,
                        warehouseName: dryFruit.warehouseName,
                        rackName: dryFruit.rackName,
                        recordId: dryFruit.recordId,
                        dateCheckIN: dryFruit.dateCheckIN,
                        dateCheckout:  dryFruit.dateCheckout,
                        _id: dryFruit._id,
                        customerId: plainHistory.customerId // Add customerId to each dry fruit in checkout
                    };
                });

                return {
                    dryFruits: modifiedDryFruits, // Keep the modified structure for dryFruits
                    invoices: checkOut.invoices.map(invoice => {
                        return {
                            dryFruitName: invoice.dryFruitName,
                            recordId: invoice.recordId,
                            weight: invoice.weight,
                            dateCheckIN: invoice.dateCheckIN,
                            dateCheckout: invoice.dateCheckout,
                            totalAmount: invoice.totalAmount,
                            storedDays: invoice.storedDays,
                            status: invoice.status,
                            customerId: plainHistory.customerId // Add customerId to each invoice
                        };
                    }),
                    _id: checkOut._id // Include the check-out ID
                };
            });

            // Return a clean history object
            return {
                _id: plainHistory._id,
                customerId: plainHistory.customerId,
                checkInHistory: modifiedCheckInHistory,
                checkOutHistory: modifiedCheckOutHistory,
                totalWeightByFruit: plainHistory.totalWeightByFruit,
                __v: plainHistory.__v
            };
        });

        // Send the modified histories as the response
        res.status(200).json(modifiedHistories);
    } catch (error) {
        console.error('Error fetching customer histories:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});








router.post('/getCheckInHistory', async (req, res) => {
    try {
        const { customerId, dateCheckIN } = req.body;

        // Validate dateCheckIN format
        if (!Date.parse(dateCheckIN)) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // Convert the provided date to a Date object
        const searchDate = new Date(dateCheckIN);

        // Find the customer history by customerId
        const customerHistory = await CustomerHistory.findOne({ customerId });

        if (!customerHistory) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Filter the checkInHistory array to match the date in dryFruits
        const filteredCheckInHistory = customerHistory.checkInHistory.filter(history => {
            return history.dryFruits.some(dryFruit => {
                return new Date(dryFruit.dateCheckIN).toDateString() === searchDate.toDateString();
            });
        });

        if (filteredCheckInHistory.length > 0) {
            return res.status(200).json({
                customerId,
                checkInHistory: filteredCheckInHistory.map(entry => entry.toObject()) // Convert each entry to a plain object
            });
        } else {
            return res.status(404).json({ message: 'No check-in history found for this date' });
        }
    } catch (error) {
        console.error('Error fetching check-in history:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});




  router.get('/calculate-total-checkin-history-length', async (req, res) => {
    try {
        // Initialize total check-in history length counter
        let totalCheckInHistoryLength = 0;

        // Query all customer histories
        const allHistories = await CustomerHistory.find();

        // Iterate through each customer history
        allHistories.forEach(customerHistory => {
            // Ensure checkInHistory is an array
            if (Array.isArray(customerHistory.checkInHistory)) {
                // Sum up the length of each checkInHistory array
                totalCheckInHistoryLength += customerHistory.checkInHistory.length;
            }
        });

        // Return the total check-in history length
        res.status(200).json({ totalCheckInHistoryLength });
    } catch (error) {
        console.error('Error in /calculate-total-checkin-history-length:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});




router.post('/checkout', async (req, res) => {
    try {
        const { customerId, dryFruits } = req.body;

        // Validate customerId
        if (!/^[0-9]{6}$/.test(customerId)) {
            return res.status(400).json({ message: 'Invalid customerId. It must be a 6-digit number.' });
        }

        // Find the customer history by customerId
        let customerHistory = await CustomerHistory.findOne({ customerId });
        if (!customerHistory) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if any of the recordIds already exist in the checkOutHistory
        for (const dryFruit of dryFruits) {
            const existingCheckout = customerHistory.checkOutHistory.some(history =>
                history.dryFruits.some(fruit => fruit.recordId === dryFruit.recordId)
            );
            if (existingCheckout) {
                return res.status(400).json({
                    message: `Dry fruit with recordId ${dryFruit.recordId} has already been checked out.`
                });
            }
        }

        // Initialize total weight map and invoices
        const totalWeightByFruit = new Map(customerHistory.totalWeightByFruit);
        const invoices = [];
        const now = new Date();

        // Update total weight and create checkout history entry
        for (const dryFruit of dryFruits) {
            const currentTotalWeight = totalWeightByFruit.get(dryFruit.name) || 0;

            // Check if there's enough quantity for checkout
            if (currentTotalWeight < dryFruit.weight) {
                return res.status(400).json({
                    message: `Not enough ${dryFruit.name} in stock. Available: ${currentTotalWeight} kg, Requested: ${dryFruit.weight} kg`
                });
            }

            // Subtract the weight from totalWeightByFruit
            const newTotalWeight = currentTotalWeight - dryFruit.weight;
            totalWeightByFruit.set(dryFruit.name, newTotalWeight);

            // Create an invoice for each dry fruit
            const dateCheckIN = new Date(dryFruit.dateCheckIN);
            const dateCheckout = now;

            if (isNaN(dateCheckIN.getTime())) {
                return res.status(400).json({ message: `Invalid dateCheckIN for recordId ${dryFruit.recordId}` });
            }

            // Calculate the difference in calendar days
            const timeDifferenceMs = dateCheckout.getTime() - dateCheckIN.getTime();
            const daysStored = Math.ceil(timeDifferenceMs / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

            // Calculate total amount (weight * daysStored)
            const totalAmount = daysStored * dryFruit.weight;

            if (isNaN(totalAmount)) {
                return res.status(400).json({ message: `Invalid totalAmount calculation for recordId ${dryFruit.recordId}` });
            }

            const invoice = {
                dryFruitName: dryFruit.name,
                recordId: dryFruit.recordId,
                weight: dryFruit.weight,
                dateCheckIN: dateCheckIN,
                dateCheckout,
                totalAmount,
                storedDays: `${daysStored} days`  // Use 'days' for stored time
            };
            invoices.push(invoice);
        }

        // Update totalWeightByFruit and checkOutHistory
        customerHistory.totalWeightByFruit = Object.fromEntries(totalWeightByFruit);
        customerHistory.checkOutHistory.push({
            dryFruits,
            dateCheckout: now,
            invoices
        });

        // Save the updated customer history
        await customerHistory.save();

        res.status(200).json({ message: 'Checkout successfully recorded', customerHistory });
    } catch (error) {
        console.error('Error in /checkout:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});



router.get('/customer-details', async (req, res) => {
    try {
        const { customerId } = req.query;

        // Validate customerId
        if (!/^[0-9]{6}$/.test(customerId)) {
            return res.status(400).json({ message: 'Invalid customerId. It must be a 6-digit number.' });
        }

        // Find the customer history by customerId
        const customerHistory = await CustomerHistory.findOne({ customerId });

        if (!customerHistory) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Convert the Mongoose document to a plain object
        const plainHistory = customerHistory.toObject();

        // Map over checkInHistory to clean it
        const modifiedCheckInHistory = plainHistory.checkInHistory.map(checkIn => {
            // Map over dryFruits to add customerId
            const modifiedDryFruits = checkIn.dryFruits.map(dryFruit => {
                return {
                    name: dryFruit.name,
                    typeOfSack: dryFruit.typeOfSack,
                    weight: dryFruit.weight,
                    cityName: dryFruit.cityName,
                    warehouseName: dryFruit.warehouseName,
                    rackName: dryFruit.rackName,
                    _id: dryFruit._id,
                    dateCheckIN: dryFruit.dateCheckIN,
                    recordId: dryFruit.recordId,
                    customerId: plainHistory.customerId // Add customerId to each dry fruit
                };
            });

            return {
                dryFruits: modifiedDryFruits, // Keep clean structure
                _id: checkIn._id // Include the check-in ID
            };
        });

        // Map over checkOutHistory to clean it and add customerId to dryFruits
        const modifiedCheckOutHistory = plainHistory.checkOutHistory.map(checkOut => {
            const modifiedDryFruits = checkOut.dryFruits.map(dryFruit => {
                return {
                    name: dryFruit.name,
                    typeOfSack: dryFruit.typeOfSack,
                    weight: dryFruit.weight,
                    cityName: dryFruit.cityName,
                    warehouseName: dryFruit.warehouseName,
                    rackName: dryFruit.rackName,
                    recordId: dryFruit.recordId,
                    dateCheckIN: dryFruit.dateCheckIN,
                    dateCheckout: dryFruit.dateCheckout, // Include dateCheckout
                    _id: dryFruit._id,
                    customerId: plainHistory.customerId // Add customerId to each dry fruit in checkout
                };
            });

            return {
                dryFruits: modifiedDryFruits, // Keep the modified structure for dryFruits
                invoices: checkOut.invoices.map(invoice => {
                    return {
                        dryFruitName: invoice.dryFruitName,
                        recordId: invoice.recordId,
                        weight: invoice.weight,
                        dateCheckIN: invoice.dateCheckIN,
                        dateCheckout: invoice.dateCheckout,
                        totalAmount: invoice.totalAmount,
                        storedDays: invoice.storedDays,
                        status: invoice.status,
                        customerId: plainHistory.customerId // Add customerId to each invoice
                    };
                }),
                _id: checkOut._id // Include the check-out ID
            };
        });

        // Return a clean history object
        const cleanHistory = {
            _id: plainHistory._id,
            customerId: plainHistory.customerId,
            checkInHistory: modifiedCheckInHistory,
            checkOutHistory: modifiedCheckOutHistory,
            totalWeightByFruit: plainHistory.totalWeightByFruit,
            __v: plainHistory.__v
        };

        // Send the modified customer history as the response
        res.status(200).json(cleanHistory);
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});



// Route to get all invoices for a specific customer
// Route to get all invoices for a specific customer
router.get('/invoices', async (req, res) => {
    try {
        const { customerId } = req.query;

        // Validate customerId
        if (!/^[0-9]{6}$/.test(customerId)) {
            return res.status(400).json({ message: 'Invalid customerId. It must be a 6-digit number.' });
        }

        // Find the customer history by customerId
        const customerHistory = await CustomerHistory.findOne({ customerId });

        if (!customerHistory) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Extract all invoices with status false from checkOutHistory
        const filteredInvoices = customerHistory.checkOutHistory.flatMap(history => 
            history.invoices.filter(invoice => invoice.status === false)
        );

        if (filteredInvoices.length > 0) {
            res.status(200).json({ customerId, invoices: filteredInvoices });
        } else {
            res.status(404).json({ customerId, message: 'No invoices with status false found for this customer' });
        }
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Route to get all invoices for all customers
router.get('/all-invoices', async (req, res) => {
    try {
        // Fetch all customer histories and include only relevant fields
        const histories = await CustomerHistory.find({}, 'customerId checkOutHistory')
            .populate({
                path: 'checkOutHistory',
                select: 'invoices', // Include only invoices
                populate: {
                    path: 'invoices',
                    select: 'dryFruitName recordId weight dateCheckIN dateCheckout totalAmount storedHours'
                }
            });

        // Format the response to include only the necessary details
        const formattedHistories = histories.map(history => ({
            customerId: history.customerId,
            invoices: history.checkOutHistory.flatMap(history => history.invoices)
        }));

        res.status(200).json({ invoices: formattedHistories });
    } catch (error) {
        console.error('Error fetching all invoices:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.get('/all-invoices-for-Approved', async (req, res) => {
    try {
        // Fetch all customer histories and include only relevant fields
        const histories = await CustomerHistory.find({}, 'customerId checkOutHistory')
            .populate({
                path: 'checkOutHistory',
                select: 'invoices', // Include only invoices
                populate: {
                    path: 'invoices',
                    select: 'dryFruitName recordId weight dateCheckIN dateCheckout totalAmount storedHours status' // Include status
                }
            });

        // Filter histories to exclude customers with no true-status invoices
        const formattedHistories = histories
            .map(history => ({
                customerId: history.customerId,
                invoices: history.checkOutHistory.flatMap(history => 
                    history.invoices.filter(invoice => invoice.status === true) // Filter only true status invoices
                )
            }))
            .filter(history => history.invoices.length > 0); // Exclude customers with no true-status invoices

        res.status(200).json({ invoices: formattedHistories });
    } catch (error) {
        console.error('Error fetching all invoices:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


router.put('/update-invoice-status', async (req, res) => {
    const { customerId, recordIds } = req.body; // Expecting an array of recordIds

    try {
        // Find the customer by customerId
        const customer = await CustomerHistory.findOne({ customerId });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Loop through checkOutHistory to update the status of matching invoices
        let invoiceFound = false;
        customer.checkOutHistory.forEach(history => {
            history.invoices.forEach(invoice => {
                if (recordIds.includes(invoice.recordId)) { // Check if recordId is in the array
                    invoice.status = false; // Update status to false
                    invoiceFound = true;
                }
            });
        });

        if (!invoiceFound) {
            return res.status(404).json({ message: 'No matching invoices found' });
        }

        // Save the updated customer document
        await customer.save();

        res.status(200).json({ message: 'Invoice status updated to false for the provided recordIds' });
    } catch (error) {
        console.error('Error updating invoice status:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.get('/invoices-for-customer', async (req, res) => {
    try {
        const { customerId } = req.query;

        // Validate the customerId
        if (!customerId) {
            return res.status(400).json({ message: 'Customer ID is required' });
        }

        // Fetch the specific customer's history and include only relevant fields
        const history = await CustomerHistory.findOne({ customerId: customerId }, 'customerId checkOutHistory')
            .populate({
                path: 'checkOutHistory',
                select: 'invoices', // Include only invoices
                populate: {
                    path: 'invoices',
                    select: 'dryFruitName recordId weight dateCheckIN dateCheckout totalAmount storedHours status' // Include status
                }
            });

        // Check if history is found
        if (!history) {
            return res.status(404).json({ message: 'Customer history not found' });
        }

        // Filter the invoices to include only those with true status
        const filteredInvoices = history.checkOutHistory.flatMap(history =>
            history.invoices.filter(invoice => invoice.status === false) // Filter only true status invoices
        );

        res.status(200).json({ invoices: filteredInvoices });
    } catch (error) {
        console.error('Error fetching invoices for customer:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.get('/dryFruitWeight/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      
      // Log the customerId received from the request
      console.log('Received customerId:', customerId);
  
      // Fetch the customer by ID
      const customer = await  CustomerHistory.findOne({ customerId });
      
      // Log the customer object found or not found
      if (!customer) {
        console.log('Customer not found for ID:', customerId);
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      console.log('Customer found:', customer);
  
      const checkInHistory = customer.checkInHistory;
  
      // Log the checkInHistory array
      console.log('checkInHistory:', checkInHistory);
  
      // Create an object to accumulate weights for matching city, warehouse, and rack
      const weightSummary = {};
  
      checkInHistory.forEach(entry => {
        console.log('Processing entry:', entry);
        entry.dryFruits.forEach(dryFruit => {
          console.log('Processing dryFruit:', dryFruit);
          const key = `${dryFruit.name}-${dryFruit.cityName}-${dryFruit.warehouseName}-${dryFruit.rackName}`;
          
          // Log the generated key
          console.log('Generated key for accumulation:', key);
          
          // If same city, warehouse, and rack exist, add the weight, otherwise initialize
          if (weightSummary[key]) {
            weightSummary[key].weight += dryFruit.weight;
            console.log('Updated weight for key:', key, 'new weight:', weightSummary[key].weight);
          } else {
            weightSummary[key] = {
              name: dryFruit.name,
              cityName: dryFruit.cityName,
              warehouseName: dryFruit.warehouseName,
              rackName: dryFruit.rackName,
              weight: dryFruit.weight
            };
            console.log('Initialized new entry in weightSummary:', weightSummary[key]);
          }
        });
      });
  
      // Log the final weightSummary object
      console.log('Final weightSummary:', weightSummary);
  
      // Convert the result object to an array
      const result = Object.values(weightSummary);
  
      // Log the final result
      console.log('Final result to return:', result);
  
      res.json(result);
    } catch (error) {
      // Detailed error logging
      console.error('Error fetching dry fruit weight:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

module.exports = router;
