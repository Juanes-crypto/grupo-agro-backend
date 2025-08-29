// Crea un nuevo archivo: /agroapp-backend/middleware/parseFormData.js
const multer = require('multer');

const parseFormData = multer().fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'name', maxCount: 1 },
    { name: 'email', maxCount: 1 },
    { name: 'password', maxCount: 1 },
    { name: 'phoneNumber', maxCount: 1 },
    { name: 'showPhoneNumber', maxCount: 1 },
    { name: 'location', maxCount: 1 }
]);

module.exports = parseFormData;