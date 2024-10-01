const express = require('express');
const router = express.Router();
const WarehouseCheckoutRequested = require('../schema/warehouseCheckoutRequested');

// POST route to add or update customer details
router.post('/request', async (req, res) => {
  const { customerId, name, email, mobile, dryFruitName, cityName, warehouseName, weight } = req.body;

  try {
    // Check if a record already exists for the given customerId
    let customer = await WarehouseCheckoutRequested.findOne({ customerId });

    if (customer) {
      // If customer exists, push the new dry fruit details to the array
      customer.dryFruitDetails.push({
        dryFruitName,
        cityName,
        warehouseName,
        weight
      });

      await customer.save();
      return res.status(200).json({ message: 'New dry fruit details added successfully', customer });
    } else {
      // If customer does not exist, create a new record
      customer = new WarehouseCheckoutRequested({
        customerId,
        name,
        email,
        mobile,
        dryFruitDetails: [{
          dryFruitName,
          cityName,
          warehouseName,
          weight
        }]
      });

      await customer.save();
      return res.status(201).json({ message: 'Customer created successfully with initial dry fruit details', customer });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error processing request', error });
  }
});

router.get('/active', async (req, res) => {
  try {
    const activeRecords = await WarehouseCheckoutRequested.find({
      'dryFruitDetails': { 
        $elemMatch: { status: true }  // Filter only those documents with at least one 'dryFruitDetails' having 'status: true'
      }
    });
    
    // Optionally, filter out the inactive details in the response to return only active records
    const filteredRecords = activeRecords.map(record => ({
      ...record.toObject(),
      dryFruitDetails: record.dryFruitDetails.filter(detail => detail.status === true) // Remove any 'dryFruitDetails' with 'status: false'
    }));

    if (filteredRecords.length > 0) {
      return res.status(200).json(filteredRecords);
    } else {
      return res.status(404).json({ message: 'No active records found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching active records', error });
  }
});


// In your Express router file

// Example Node.js/Express route
// Assuming you want to update specific dry fruit details based on IDs
router.put('/deactivate/:customerId', async (req, res) => {
  const { customerId } = req.params;
  const { dryFruitIds } = req.body; // Array of dry fruit IDs to update

  try {
    // Update matching dry fruit details based on the IDs
    const result = await WarehouseCheckoutRequested.updateMany(
      { customerId, 'dryFruitDetails._id': { $in: dryFruitIds } }, // Find matching customer and dry fruit details
      { $set: { 'dryFruitDetails.$[elem].status': false } }, // Set the status to false for matched dry fruit details
      { arrayFilters: [{ 'elem._id': { $in: dryFruitIds } }] } // Use array filters to apply changes to specific elements
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ message: 'Dry fruit details updated successfully' });
    } else {
      return res.status(404).json({ message: 'No matching records found or already deactivated' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error processing request', error });
  }
});
;



router.get('/deactivated/:customerId', async (req, res) => {
  const { customerId } = req.params;

  try {
    // Find the customer with the matching customerId and deactivated dry fruit details
    const customer = await WarehouseCheckoutRequested.findOne({
      customerId,
      'dryFruitDetails': { 
        $elemMatch: { status: false } // Only return customers with at least one inactive dry fruit
      }
    });

    if (customer) {
      // Filter the dryFruitDetails to only return those with status: false
      const filteredCustomer = {
        ...customer.toObject(),
        dryFruitDetails: customer.dryFruitDetails.filter(detail => detail.status === false)
      };

      return res.status(200).json(filteredCustomer);
    } else {
      return res.status(404).json({ message: 'No deactivated record found for this customerId' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving record', error });
  }
});

module.exports = router;
