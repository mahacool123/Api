const mongoose = require('mongoose');

// Dry fruit details schema
const DryFruitDetailSchema = new mongoose.Schema({
    dryFruitName: { type: String, required: true },
    dateCheckIN: { type: Date, required: true },
    weight: { type: Number, required: true },
    recordId: { type: String, required: true },
    storageDays: { type: Number },
    amount: { type: Number } // amount with GST now
});

// Monthly Invoice schema
const MonthlyInvoiceSchema = new mongoose.Schema({
    customerId: { type: String, required: true },
    dryFruitDetails: [DryFruitDetailSchema],
    grandTotalWeight: { type: Number },
    unpaidRemainingAmount: { type: Number },
    grandTotalAmount: { type: Number }, // sum of amounts (with GST)
    unpaidMonthly: { type: Map, of: Number, default: {}, },
    paidMonthlyTotals: { type: Map, of: Number, default: {}, },
    paidGrandTotalAmounts: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, required: true }
        }
    ],
    totalPaidAmount: { type: Number, default: 0 } 
});

MonthlyInvoiceSchema.methods.calculateTotalPaidAmount = function() {
    this.totalPaidAmount = this.paidGrandTotalAmounts.reduce((acc, payment) => acc + payment.amount, 0);
};
// Method to calculate storage days and amounts (with GST included)
MonthlyInvoiceSchema.methods.calculateStorageAndAmount = function() {
    const currentDate = new Date();
    let totalWeight = 0;
    let totalAmount = 0;
    const monthlyBreakdown = {};
    const gstRate = 0.18; // GST rate

    this.dryFruitDetails.forEach(dryFruit => {
        const daysStored = Math.ceil((currentDate - dryFruit.dateCheckIN) / (1000 * 60 * 60 * 24));
        const baseAmount = dryFruit.weight * daysStored;

        dryFruit.storageDays = daysStored;
        
        // Apply GST to the base amount
        dryFruit.amount = baseAmount + (baseAmount * gstRate);

        totalWeight += dryFruit.weight;
        totalAmount += dryFruit.amount;

        const checkInDate = new Date(dryFruit.dateCheckIN);
        const monthYear =` ${checkInDate.toLocaleString('default', { month: 'short' })}-${checkInDate.getFullYear()}`;

        monthlyBreakdown[monthYear] = (monthlyBreakdown[monthYear] || 0) + dryFruit.amount;
    });

    this.grandTotalWeight = totalWeight;
    this.grandTotalAmount = totalAmount; // No additional GST on total, as it's already included in individual amounts
    this.unpaidMonthly = monthlyBreakdown;
};

// Method to calculate unpaid remaining amount
MonthlyInvoiceSchema.methods.calculateUnpaidRemainingAmount = function() {
    const totalPaid = this.paidGrandTotalAmounts.reduce((acc, payment) => acc + payment.amount, 0);
    this.unpaidRemainingAmount = this.grandTotalAmount - totalPaid;
};
// Method to process payments (logs payment amount, unpaidMonthly, and paidMonthlyTotals)
MonthlyInvoiceSchema.methods.processPayments = async function() {
    const unpaidMonthly = this.unpaidMonthly || new Map();
    console.log('Current unpaidMonthly:', unpaidMonthly);

    const paidMonthly = new Map();
    const totalPaid = this.paidGrandTotalAmounts.reduce((acc, payment) => acc + payment.amount, 0) || 0;
    console.log('Total amount paid:', totalPaid);

    // Convert unpaidMonthly to an array and sort by month
    const unpaidEntries = Array.from(unpaidMonthly.entries()).sort((a, b) => {
        return new Date(a[0]) - new Date(b[0]); // Sort by month (ascending)
    });

    let remainingAmount = totalPaid;

    // Iterate over each unpaid month to distribute the paid amount
    for (let [month, unpaidAmount] of unpaidEntries) {
        if (remainingAmount <= 0) break; // Stop if there's no remaining amount

        if (remainingAmount >= unpaidAmount) {
            // Allocate the full unpaid amount to this month
            paidMonthly.set(month, unpaidAmount);
            console.log(`Distributing ${unpaidAmount} to ${month}.`);
            remainingAmount -= unpaidAmount; // Deduct from remaining amount
        } else {
            // Allocate the remaining amount to this month
            paidMonthly.set(month, remainingAmount);
            console.log(`Distributing ${remainingAmount} to ${month}.`);
            remainingAmount = 0; // All paid amount is allocated
        }
    }

    // Update paidMonthlyTotals in the invoice
    this.paidMonthlyTotals = paidMonthly;

    // Log the updated paidMonthly
    console.log('Updated paidMonthlyTotals:', this.paidMonthlyTotals);

    // After distribution, update unpaidMonthly
    for (let [month, unpaidAmount] of unpaidEntries) {
        const paidAmount = paidMonthly.get(month) || 0;
        unpaidMonthly.set(month, unpaidAmount - paidAmount);
    }

    // Log the remaining unpaid amounts
    console.log('Updated unpaidMonthly:', unpaidMonthly);
    
    return totalPaid; // Optionally return the total paid amount
};










MonthlyInvoiceSchema.pre('save', function(next) {
    try {
        this.calculateStorageAndAmount();
        this.calculateUnpaidRemainingAmount();
        this.calculateTotalPaidAmount(); 
    
        next();
    } catch (error) {
        console.error(`Error before saving invoice: ${error.message}`);
        next(error);
    }
});

const MonthlyInvoice = mongoose.model('MonthlyInvoice', MonthlyInvoiceSchema);
module.exports = MonthlyInvoice;

