
// const CustomerHistory = require('../schema/CustomerHistory');
// const MonthlyInvoice = require('../schema/MonthlyInvoice');
// const cron = require('node-cron');

// async function processAllCustomerHistories() {
//     try {
//         const customerHistories = await CustomerHistory.find({});
//         if (customerHistories.length > 0) {
//             console.log(`Fetched ${customerHistories.length} Customer Histories`);
            
//             for (const customerHistory of customerHistories) {
//                 console.log('Processing Customer History:', customerHistory);
//                 await saveNewInvoices(customerHistory);
//             }
//         } else {
//             console.log('No customer histories found');
//         }
//     } catch (error) {
//         console.error('Error fetching and processing customer histories:', error);
//     }
// }

// // Function to save new invoices
// // Function to save new invoices and handle checkout
// async function saveNewInvoices(customerHistory) {
//     try {
//         const { customerId, checkInHistory, checkOutHistory } = customerHistory;

//         console.log('Processing Customer History for Customer ID:', customerId);

//         // Handle check-ins
//         for (const checkIn of checkInHistory) {
//             const { dateCheckIN, dryFruits } = checkIn;

//             for (const dryFruit of dryFruits) {
//                 console.log('Processing Dry Fruit Record ID:', dryFruit.recordId);

//                 const isCheckedOut = checkOutHistory.some(checkOut =>
//                     checkOut.dryFruits.some(dryFruitOut => dryFruitOut.recordId === dryFruit.recordId)
//                 );

//                 if (!isCheckedOut) {
//                     console.log('Dry fruit not checked out, checking existing invoices');

//                     let existingInvoice = await MonthlyInvoice.findOne({ customerId });

//                     if (!existingInvoice) {
//                         console.log(`No invoice found for Customer ID: ${customerId}. Creating a new one.`);

//                         const newInvoice = new MonthlyInvoice({
//                             customerId,
//                             dryFruitDetails: [
//                                 {
//                                     dryFruitName: dryFruit.name,
//                                     dateCheckIN: dateCheckIN,
//                                     weight: dryFruit.weight,
//                                     recordId: dryFruit.recordId
//                                 }
//                             ]
//                         });

//                         console.log('Saving New Invoice:', newInvoice);
//                         await newInvoice.save();
//                     } else {
//                         console.log(`Found existing invoice for Customer ID: ${customerId}`);

//                         const existingDryFruit = existingInvoice.dryFruitDetails.find(
//                             detail => detail.recordId === dryFruit.recordId
//                         );

//                         if (!existingDryFruit) {
//                             console.log('Appending new dry fruit to existing invoice:', dryFruit);
//                             existingInvoice.dryFruitDetails.push({
//                                 dryFruitName: dryFruit.name,
//                                 dateCheckIN: dateCheckIN,
//                                 weight: dryFruit.weight,
//                                 recordId: dryFruit.recordId
//                             });
//                         } else {
//                             console.log(`Dry fruit with Record ID ${dryFruit.recordId} already exists in the invoice`);
//                         }

//                         await existingInvoice.save();
//                     }
//                 } else {
//                     console.log('Dry fruit has been checked out, skipping invoice creation.');
//                 }
//             }
//         }

//         // Handle check-outs
//         for (const checkOut of checkOutHistory) {
//             const { dryFruits: checkedOutDryFruits } = checkOut;

//             for (const dryFruitOut of checkedOutDryFruits) {
//                 console.log('Processing checkout for Dry Fruit Record ID:', dryFruitOut.recordId);

//                 // Find the existing invoice
//                 let existingInvoice = await MonthlyInvoice.findOne({ customerId });

//                 if (existingInvoice) {
//                     // Find the dry fruit entry in the invoice
//                     const dryFruitIndex = existingInvoice.dryFruitDetails.findIndex(
//                         detail => detail.recordId === dryFruitOut.recordId
//                     );

//                     if (dryFruitIndex !== -1) {
//                         console.log(`Found dry fruit with Record ID ${dryFruitOut.recordId} in the invoice. Deleting...`);

//                         // Remove the dry fruit entry from the invoice
//                         existingInvoice.dryFruitDetails.splice(dryFruitIndex, 1);

//                         // Save the updated invoice
//                         await existingInvoice.save();
//                         console.log(`Dry fruit with Record ID ${dryFruitOut.recordId} deleted from the invoice.`);
//                     } else {
//                         console.log(`Dry fruit with Record ID ${dryFruitOut.recordId} not found in the invoice.`);
//                     }
//                 } else {
//                     console.log(`No invoice found for Customer ID: ${customerId}`);
//                 }
//             }
//         }

//     } catch (error) {
//         console.error('Error saving invoices:', error);
//     }
// }

// // Schedule the cron job to run every second
// cron.schedule('* * * * * *', () => {
//     console.log('Running scheduled task to process customer histories');
//     processAllCustomerHistories();
// });
const cron = require('node-cron');
const CustomerHistory = require('../schema/CustomerHistory');
const MonthlyInvoice = require('../schema/MonthlyInvoice');

// Function to process all customer histories
async function processAllCustomerHistories() {
    try {
        const customerHistories = await CustomerHistory.find({});
        console.log(`Fetched ${customerHistories.length} Customer Histories`);

        if (customerHistories.length > 0) {
            await Promise.all(customerHistories.map(saveNewInvoices));
        } else {
            console.log('No customer histories found');
        }
    } catch (error) {
        console.error('Error fetching customer histories:', error);
    }
}

// Function to save new invoices and handle checkouts
async function saveNewInvoices(customerHistory) {
    try {
        const { customerId, checkInHistory = [], checkOutHistory = [] } = customerHistory;

        let existingInvoice = await MonthlyInvoice.findOne({ customerId });

        if (!existingInvoice) {
            console.log(`No invoice found for Customer ID: ${customerId}, creating a new one.`);
            existingInvoice = new MonthlyInvoice({ customerId, dryFruitDetails: [] });
        }

        // Process Check-ins
        for (const checkIn of checkInHistory) {
            const { dryFruits } = checkIn; // Accessing dryFruits directly

            for (const dryFruit of dryFruits) {
                const { dateCheckIN } = dryFruit; // Accessing dateCheckIN from the dryFruit object

                const isCheckedOut = checkOutHistory.some(checkOut =>
                    checkOut.dryFruits.some(dryFruitOut => dryFruitOut.recordId === dryFruit.recordId)
                );

                if (!isCheckedOut) {
                    const existingDryFruit = existingInvoice.dryFruitDetails.find(
                        detail => detail.recordId === dryFruit.recordId
                    );

                    if (!existingDryFruit) {
                        existingInvoice.dryFruitDetails.push({
                            dryFruitName: dryFruit.name,
                            dateCheckIN, // Now we are correctly setting dateCheckIN from the dryFruit
                            weight: dryFruit.weight,
                            recordId: dryFruit.recordId
                        });
                    }
                }
            }
        }

        // Process Check-outs
        for (const checkOut of checkOutHistory) {
            const { dryFruits: checkedOutDryFruits } = checkOut;

            for (const dryFruitOut of checkedOutDryFruits) {
                const dryFruitIndex = existingInvoice.dryFruitDetails.findIndex(
                    detail => detail.recordId === dryFruitOut.recordId
                );

                if (dryFruitIndex !== -1) {
                    existingInvoice.dryFruitDetails.splice(dryFruitIndex, 1);
                }
            }
        }

        // Save and update invoice
        await existingInvoice.save();
        console.log(`Invoice for Customer ID: ${customerId} updated.`);
    } catch (error) {
        console.error('Error saving invoices for Customer ID:', customerHistory.customerId, error);
    }
}


// Schedule the cron job to run at midnight every day
cron.schedule('0 * * * *', () => {
    console.log('Running scheduled task to process customer histories every second');
    processAllCustomerHistories();
});
