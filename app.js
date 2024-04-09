require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const multer = require('multer');
const { pdftoJson } = require('./pdfToJson');
const axios = require('axios');
const jwtSecret = process.env.VOLUNTEER_SERVER_SECRET;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//create buffer from req file data

const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/volunteer-upload-pdf', upload.single('file'), async (req, res) => {
    const authToken = req.headers['x-access-token'];
    if(!authToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = jwt.verify(authToken, process.env.JWT_VOLUNTEER_SECRET);

    if(!payload) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Immediately acknowledge the file upload
    res.status(200).json({ message: "Upload received, processing started." });

    try {
        const fileBuffer = req.file.buffer;
        const token = req.headers['x-access-token'];
        const { booth } = req.body;

        // Process PDF to JSON in the background
        pdftoJson(fileBuffer).then(result => {
            return axios.post(`${process.env.VOLUNTEER_SERVER_URL}/api/volunteer/volunteer-upload-pdf`, {
                data: result,
                booth
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            });
        }).then(() => {
            console.log('Processing and upload successful');
        }).catch(error => {
            console.error('Error during processing or upload', error);
        });

    } catch (error) {
        console.error('An error occurred:', error);
    }
});

app.post('/api/admin-upload-pdf', upload.single('file'), async (req, res) => {
    const authToken = req.headers['x-access-token'];
    if(!authToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = jwt.verify(authToken, process.env.JWT_ADMIN_SECRET);

    if(!payload) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Immediately acknowledge the file upload
    res.status(200).json({ message: "Upload received, processing started." });

    try {
        const fileBuffer = req.file.buffer;
        const token = req.headers['x-access-token'];
        const { booth, district, constituency, assembly } = req.body;

        // Process PDF to JSON in the background
        pdftoJson(fileBuffer).then(result => {
            return axios.post(`${process.env.VOLUNTEER_SERVER_URL}/api/admin/admin-upload-pdf`, {
                data: result,
                booth,
                district,
                constituency,
                assembly
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            });
        }).then(() => {
            console.log('Processing and upload successful');
        }).catch(error => {
            console.error('Error during processing or upload', error);
        });

    } catch (error) {
        console.error('An error occurred:', error);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server started on port ' + process.env.PORT || 3000);
})