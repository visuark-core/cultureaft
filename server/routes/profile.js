const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.get('/:userId', getProfile);
router.put('/:userId', upload.single('avatar'), updateProfile);

module.exports = router;