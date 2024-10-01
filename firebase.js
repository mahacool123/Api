const admin = require('firebase-admin');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names

// Initialize Firebase Admin SDK
const serviceAccount = require('./mahacool-5b59f-firebase-adminsdk-er29u-375d3e6743.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'mahacool-5b59f.appspot.com' // Updated to 'appspot.com'
});



// Function to generate PDF from HTML without size definition
const bucket = admin.storage().bucket();

// Function to upload PDF to Firebase Storage
const uploadPDFToFirebase = async (pdfBuffer) => {
  const uniqueFilename = `${uuidv4()}-invoice.pdf`;
  const fileUpload = bucket.file(uniqueFilename);

  // Upload the PDF buffer to Firebase
  await fileUpload.save(pdfBuffer, {
    metadata: {
      contentType: 'application/pdf',
    },
    public: true, // Make the file publicly accessible
  });

  // Return the public URL for the uploaded PDF
  return `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;
};

module.exports = {
  uploadPDFToFirebase,
};
