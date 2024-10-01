const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const {ClientSchemas, getNextCustomerID }  = require('../schema/Client');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const multer = require('multer');  // Import multer here
const { uploadPDFToFirebase } = require('../firebase');

const upload = multer();

const pdf = require('html-pdf');

const generatePDF = (htmlContent) => {
  return new Promise((resolve, reject) => {
    pdf.create(htmlContent).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
};
  // Express route to handle the HTML to PDF conversion and Firebase upload
  router.post('/upload/:clientId', upload.single('file'), async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const file = req.file;
  
      if (!file) {
        return res.status(400).send('No file uploaded');
      }
  
      // Convert the uploaded HTML file buffer to string
      const htmlContent = file.buffer.toString();
  
      // Generate PDF from the HTML content (without predefined size)
      const pdfBuffer = await generatePDF(htmlContent);
  
      // Upload PDF to Firebase and get the download URL
      const pdfUrl = await uploadPDFToFirebase(pdfBuffer);
  
      // Find the client by clientId and update file URLs (assuming MongoDB)
      const client = await ClientSchemas.findOne({ customerID: clientId });
  
      if (!client) {
        return res.status(404).json({ msg: 'Client not found' });
      }
  
      // Add the PDF URL to the client's fileUrls array
      client.fileUrls.push({
        url: pdfUrl,
        date: new Date().toISOString(),
      });
  
      // Save the updated client data
      await client.save();
  
      res.status(200).json({ msg: 'PDF uploaded successfully', pdfUrl, client });
    } catch (error) {
      console.error('Error occurred:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  });
// Get all clients
router.get('/getall', async (req, res) => {
    try {
        let policies = await ClientSchemas.find();
        res.json(policies);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }

        const { email, mobile, password, customerID } = req.body;
        let query = {};

        // Determine which identifier to use for the query
        if (email) {
            query.email = email;
        } else if (mobile) {
            query.mobile = mobile;
        } else if (customerID) {
            query.customerID = customerID;
        } else {
            return res.status(400).json({ msg: 'Either email, mobile, or customer ID must be provided' });
        }

        let employer = await ClientSchemas.findOne(query);

        if (!employer) {
            return res.status(401).json("Client not found");
        }

        const isMatch = await bcrypt.compare(password, employer.password);

        if (isMatch) {
            res.status(200).json(employer);
        } else {
            return res.status(401).json("Password does not match");
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});


// Add a new client
router.post('/add', [
    check('name', 'Name is required').not().isEmpty(),
    check('bussinessName', 'Business Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('mobile', 'Please include a valid mobile number').isLength({ min: 10, max: 10 }),
    check('gstNumber', 'GST Number is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, bussinessName, email, password, mobile, address, gstNumber } = req.body;

    try {
        // Check if the email already exists
        const existingEmail = await ClientSchemas.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email already exists." });
        }

        // Check if the mobile number already exists
        const existingMobile = await ClientSchemas.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({ msg: "Mobile number already exists." });
        }
        const customerID = generateCustomerID();
        // Encrypt the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new client
        const newClient = new ClientSchemas({
            name,
            bussinessName,
            email,
            password: hashedPassword,  // Store the hashed password
            mobile,
            address,
            gstNumber,
            role: 'client',
            customerID  // Automatically sets the role to 'client'
        });

        await newClient.save();

        res.json(newClient);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: "Server Error" });
    }
});


// Remove a client
router.post('/remove', async (req, res) => {
    try {
        let employer = await ClientSchemas.findOne({ "_id": req.body.id });
        if (!employer) {
            return res.status(404).json("Client not found");
        }

        await ClientSchemas.deleteOne({ "_id": req.body.id });
        return res.status(200).json("Client deleted");
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: error.message });
    }
});

// Update client details
router.post('/update', async (req, res) => {
    try {
        let { id } = req.query;
        let employer = await ClientSchemas.findById(id);

        if (!employer) {
            return res.status(404).json("Client not found");
        }

        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        Object.assign(employer, req.body);
        await employer.save();
        res.json(employer);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: "Server Error" });
    }
});

// Get client details
router.get('/details', (req, res) => {
    let { id } = req.query;
    ClientSchemas.findById(id).then(result => {
        res.status(200).json(result);
    }).catch(error => {
        console.log(error);
        res.status(500).json({ error: error });
    });
});

router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('bussinessName', 'Business name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('mobile', 'Please include a valid mobile number').isLength({ min: 10, max: 10 }),
    check('address', 'Address is required').not().isEmpty(),
    // Uncomment if GST Number is required
    // check('gstNumber', 'GST Number is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, bussinessName, email, password, mobile, address, gstNumber } = req.body;

    try {
        let existingEmail = await ClientSchemas.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email already exists." });
        }

        let existingMobile = await ClientSchemas.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({ msg: "Mobile number already exists." });
        }

        const customerID = await getNextCustomerID(); // Get the next customer ID
        const hashedPassword = await bcrypt.hash(password, 10);

        const newClient = new ClientSchemas({
            name,
            bussinessName,
            email,
            password: hashedPassword,
            mobile,
            address,
            gstNumber,
            role: 'client',
            customerID
        });

        await newClient.save();

        // Return the client without the password
        const { password: _, ...clientData } = newClient.toObject();
        res.json(clientData);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ msg: "Server Error" });
    }
});


// Get multiple clients by IDs
router.post('/clients', async (req, res) => {
    try {
        console.log('Request body:', req.body);

        const clientIds = req.body.clientIds;
        console.log('Received client IDs:', clientIds);

        if (!Array.isArray(clientIds) || clientIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input: Client IDs must be a non-empty array.' });
        }

        const clientsData = await ClientSchemas.find({ _id: { $in: clientIds } });
        console.log('Clients data fetched from database:', clientsData);

        if (!clientsData || clientsData.length === 0) {
            return res.status(404).json({ message: 'No clients found' });
        }

        res.json(clientsData);
    } catch (error) {
        console.error('Error fetching client data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Helper function to generate customer ID
function generateCustomerID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


router.post('/password-resetRequest-Details', async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }

        const { email, mobile, customerID } = req.body;
        let query = {};

        // Determine which identifier to use for the query
        if (email) {
            query.email = email;
        } else if (mobile) {
            query.mobile = mobile;
        } else if (customerID) {
            query.customerID = customerID;
        } else {
            return res.status(400).json({ msg: 'Either email, mobile, or customer ID must be provided' });
        }

        // Retrieve only the _id field
        let employer = await ClientSchemas.findOne(query).select('_id');

        if (!employer) {
            return res.status(401).json("Client not found");
        }

        // Respond with only the _id
        res.status(200).json({ _id: employer._id });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.get('/client-name-business', async (req, res) => {
    console.log(req.body);
    try {
        const { customerID } = req.query;

        if (!customerID) {
            return res.status(400).json({ msg: "customerID is required" });
        }

        // Find the client by customerID and select only the name and businessName fields
        const client = await ClientSchemas.findOne({ customerID }).select('name bussinessName');

        if (!client) {
            return res.status(404).json({ msg: "Client not found" });
        }

        // Return only the selected fields
        res.status(200).json({
            name: client.name,
            bussinessName: client.bussinessName
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: "Internal Server Error" });
    }
});



const otpStore = new Map();  // Store OTP and expiration per email

// Helper function to generate OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
}

// Password Reset Request - Send OTP
router.post('/password-reset-request', async (req, res) => {
    try {
        const { email } = req.body;

        console.log(`Received password reset request for email: ${email}`);

        if (!email) {
            console.log("Email is required");
            return res.status(400).json({ msg: "Email is required" });
        }

        // Step 1: Check if the email exists in the database
        const user = await ClientSchemas.findOne({ email });
        console.log(`Checking if user exists for email: ${email}`);

        if (!user) {
            console.log("Email not found");
            return res.status(404).json({ msg: "Email not found" });
        }

        // Step 2: Generate OTP and expiration (e.g., 5 minutes)
        const otp = generateOTP();
        const otpExpires = Date.now() + 5 * 60 * 1000;  // 5 minutes from now

        console.log(`Generated OTP: ${otp}, OTP expiration: ${new Date(otpExpires).toISOString()}`);

        // Step 3: Store OTP and expiration in memory (you can also store it in the database if needed)
        otpStore.set(email, { otp, otpExpires });
        console.log(`Stored OTP for email: ${email}`);

        // Step 4: Send OTP via email (using nodemailer)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'mahacoolstore@gmail.com',  // Replace with your email
                pass: 'ffik atrb dyjt veqg',  // Replace with your app-specific password
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: 'mahacoolstore@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Error sending OTP email:", error);
                return res.status(500).json({ msg: 'Error sending OTP email' });
            }
            console.log(`OTP sent to email: ${email}`);
            return res.status(200).json({ msg: "OTP sent to your email" });
        });

    } catch (error) {
        console.log("Internal Server Error:", error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

// Reset Password using OTP
router.post('/password-reset', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        console.log(`Received password reset for email: ${email}`);

        if (!email || !otp || !newPassword) {
            console.log("Email, OTP, and new password are required");
            return res.status(400).json({ msg: "Email, OTP, and new password are required" });
        }

        // Check if the OTP is stored in memory
        const otpData = otpStore.get(email);
        console.log(`Checking stored OTP for email: ${email}`);

        if (!otpData) {
            console.log("OTP not found. Please request a new OTP.");
            return res.status(400).json({ msg: "OTP not found. Please request a new OTP." });
        }

        // Check if the OTP matches and is not expired
        if (otpData.otp !== otp || otpData.otpExpires < Date.now()) {
            console.log("Invalid or expired OTP");
            return res.status(400).json({ msg: "Invalid or expired OTP" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(`Hashed new password for email: ${email}`);

        // Update the password in your database
        const client = await ClientSchemas.findOne({ email });
        console.log(`Finding client for email: ${email}`);

        if (!client) {
            console.log("Client not found");
            return res.status(404).json({ msg: "Client not found" });
        }

        client.password = hashedPassword;
        await client.save();
        console.log(`Password updated successfully for email: ${email}`);

        // Remove the OTP from memory after successful reset
        otpStore.delete(email);
        console.log(`OTP removed from store for email: ${email}`);

        res.status(200).json({ msg: "Password reset successful" });
    } catch (error) {
        console.log("Internal Server Error:", error.message);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

router.post('/add-location', async (req, res) => {
    const { customerID, latitude, longitude } = req.body;

    // Check if all necessary fields are provided
    if (!customerID || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ msg: 'Please provide customerID, latitude, and longitude' });
    }

    try {
        // Find client by customerID
        let client = await ClientSchemas.findOne({ customerID });

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // Add the new location to the client's location array
        client.location.push({ latitude, longitude });

        // Save the updated client
        await client.save();

        res.status(200).json({ msg: 'Location added successfully', client });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


router.get('/latest-location', async (req, res) => {
    const { customerID } = req.query;

    // Check if customerID is provided
    if (!customerID) {
        return res.status(400).json({ msg: 'customerID is required' });
    }

    try {
        // Find client by customerID
        let client = await ClientSchemas.findOne({ customerID });

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // Check if the client has any locations stored
        if (client.location.length === 0) {
            return res.status(404).json({ msg: 'No locations found for this client' });
        }

        // Get the latest location (the last element in the location array)
        const latestLocation = client.location[client.location.length - 1];

        res.status(200).json({ latestLocation });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Multer setup for file upload


  



router.get('/files/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId; // Get customerId from request params

        // Find the client by customerId
        const client = await ClientSchemas.findOne({ customerID: customerId });

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // Return the fileUrls array with URLs and dates
        res.status(200).json({ fileUrls: client.fileUrls });
    } catch (error) {
        console.error(error.message); // Use console.error for error logging
        res.status(500).json({ msg: 'Server error' });
    }
});




router.get('/invoice-details/:customerID', async (req, res) => {
    try {
        const customerID = req.params.customerID;
        
        // Find client by customerID
        const client = await ClientSchemas.findOne({ customerID: customerID }, 'name mobile gstNumber address email');

        // If no client is found, return a 404 response
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Return the client details
        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/file-urls', async (req, res) => {
    try {
        // Fetch all clients with customerID and fileUrls
        const clients = await ClientSchemas.find({}, 'customerID fileUrls');
        
        // Check if data exists
        if (!clients || clients.length === 0) {
            return res.status(404).json({ message: 'No clients found!' });
        }

        // Send the response with customerID and fileUrls
        res.status(200).json(clients);
    } catch (error) {
        console.error('Error fetching fileUrls:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
