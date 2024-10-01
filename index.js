const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require('http');
const socketIo = require('socket.io');

require('./api/monthltinvoiceserver');


const app = express();

// Initialize Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['https://new-inventory-render-1.onrender.com','http://localhost:4200','https://mahacool-872ff.web.app','https://mahacool-frontend.web.app'], // Allow specific origin
        methods: ['GET', 'POST'], // Allowed methods
        credentials: true // Allow credentials if needed
    }
});


// WebSocket for notification
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


// MongoDB connection
const uri = "mongodb+srv://mahacoolstore:Mahacool123@mahacoolcluster.f8lyr.mongodb.net/mahacool?retryWrites=true&w=majority&appName=MahaCoolCluster";
const connectToDatabase = async () => {
    try {
        await mongoose.connect(uri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log("MongoDB is connected");
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};
connectToDatabase();  

// Middleware setup
app.use(cors({
    origin: ['https://new-inventory-render-1.onrender.com','http://localhost:4200','https://mahacool-872ff.web.app','https://mahacool-frontend.web.app'], // Allow specific origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    credentials: true, // Include credentials if needed
}));// Enable CORS
app.use(xss()); // Protect against XSS attacks
app.use(helmet()); // Enhance security with Helmet
app.use(mongoSanitize()); // Protect against MongoDB operator injection
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.json({ limit: '100mb' })); // Parse JSON bodies up to 50MB
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));  // Set URL-encoded body limit to 50 MB
 // Serve static files from root

// Route setup
app.use("/api/notification", require("./api/notification")(io));
app.use("/api/client", require("./api/client")); 
app.use("/api/user", require("./api/user"));
app.use("/api/upload", require("./api/upload"));

app.use("/api/driver", require("./api/driver"));
app.use("/api/manager", require("./api/manager"));
app.use("/api/security", require("./api/security"));
app.use("/api/superadmin", require("./api/superadmin"));
app.use("/api/admin", require("./api/admin"));
app.use("/api/city", require("./api/city"));
app.use("/api/container", require("./api/container"));
app.use("/api/rack", require("./api/rack"));
app.use("/api/store", require("./api/store"));
app.use("/api/box", require("./api/box"));
app.use("/api/cfile", require("./api/cfile"));
app.use("/api/invoices", require("./api/invoice"));
app.use("/api/shistory", require("./api/shistory"));
app.use("/api/companies", require("./api/companies"));
app.use("/api/request", require("./api/request"));
app.use("/api/dhistory", require("./api/dhistory"));
app.use("/api/mhistory", require("./api/mhistory"));
app.use("/api/companyinfo", require("./api/companyinfo"));
app.use("/api/PasswordResetRequest", require("./api/PasswordResetRequest"));
app.use("/api/WarehouseRequested", require("./api/WarehouseRequested"));
app.use("/api/CustomerHistory", require("./api/CustomerHistory"));
app.use("/api/MonthlyInvoice", require("./api/MonthlyInvoice"));
app.use("/api/warehouseCheckoutRequested", require("./api/warehouseCheckoutRequested"));





// Create a parser for reading lines




// Default route                                                                                                                                    
            
app.get("/", (req, res) => {
    console.log("hello");
    res.json("working");
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server is up and running at ${port}`));

