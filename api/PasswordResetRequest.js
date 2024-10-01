const express = require('express');
const router = express.Router();
const PasswordResetRequest = require('../schema/PasswordResetRequest');

// Endpoint to request password reset
router.post('/password-reset', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Client ID is required.' });
  }

  try {
    // Create a new password reset request
    const resetRequest = new PasswordResetRequest({ clientId: id });
    await resetRequest.save();

    res.status(200).json({ message: 'Password reset request has been recorded.' });
  } catch (error) {
    console.error('Error creating password reset request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/getAll', async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({ passwordUpdated: false });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



router.patch('/status', async (req, res) => {
  try {
    const { clientId } = req.body;
    const updateResult = await PasswordResetRequest.updateOne(
      { clientId },
      { passwordUpdated: true }
    );
    if (updateResult.nModified === 0) {
      return res.status(404).json({ message: 'Reset request not found' });
    }
    res.json({ message: 'Reset request marked as updated' });
  } catch (error) {
    console.error('Error marking reset request as updated:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
