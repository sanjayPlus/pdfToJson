require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const { pdftoJson } = require('./pdfToJson');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const queue = [];
let isProcessing = false;

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/api/admin-upload-pdf', upload.single('file'), async (req, res) => {
    const authToken = req.headers['x-access-token'];
    if (!authToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Add the task to the queue
    queue.push({
        buffer: req.file.buffer,
        token: authToken,
        metadata: req.body, // This includes any additional data like booth, district, etc.,
        endpoint: '/admin/admin-upload-pdf'
    });

    res.status(200).json({ message: "Upload received, queued for processing." });

    // Start processing if not already doing so
    if (!isProcessing) {
        processQueue();
    }
});
app.post('/api/volunteer-upload-pdf', upload.single('file'), async (req, res) => {
    const authToken = req.headers['x-access-token'];
    if (!authToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Add the task to the queue
    queue.push({
        buffer: req.file.buffer,
        token: authToken,
        metadata: req.body, // This includes any additional data like booth, district, etc.
        endpoint: '/volunteer/volunteer-upload-pdf'
    });

    res.status(200).json({ message: "Upload received, queued for processing." });

    // Start processing if not already doing so
    if (!isProcessing) {
        processQueue();
    }
});

async function processQueue() {
    if (queue.length === 0) {
        isProcessing = false;
        return;
    }

    isProcessing = true;
    const { buffer, token, metadata, endpoint } = queue.shift();

    try {
        const result = await pdftoJson(buffer);
        await axios.post(`${process.env.VOLUNTEER_SERVER_URL}/api/${endpoint}`, {
            data: result,
            ...metadata
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            }
        });

        console.log('Processing and upload successful');
    } catch (error) {
        console.error('Error during processing or upload', error);
    } finally {
        // Optionally clear cache or temp data here
        processQueue(); // Process the next item in the queue
    }
}
app.listen(process.env.PORT || 3000, () => {
    console.log('Server started on port ' + (process.env.PORT || 3000));
});
