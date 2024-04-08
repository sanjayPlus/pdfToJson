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
    try {
        const fileBuffer = req.file.buffer;
        const volunteerToken = req.body.volunteerToken;
        const {booth} = req.body;
        const result = await pdftoJson(fileBuffer);
        const resp = await axios.post(`${process.env.VOLUNTEER_SERVER_URL}/api/volunteer/add-json-data`, {
            data: result,
            token: jwt.sign({ data: result }, jwtSecret),
            booth
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': volunteerToken
            }
        })

        res.status(200).json({message:"Added Successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while processing the PDF file.' });
    }

})
app.post('/api/admin-upload-pdf', upload.single('file'), async (req, res) => {
    try {
        const fileBuffer = req.file.buffer;
        const adminToken = req.body.adminToken;
        const {booth,district,constituency} = req.body;
        console.log(fileBuffer);
        const result = await pdftoJson(fileBuffer);
        axios.post(`${process.env.VOLUNTEER_SERVER_URL}/api/admin/add-json-data`, {
            data: result,
            token: jwt.sign({ data: result }, jwtSecret),

        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': adminToken
            }
        })

        res.status(200).json({message:"Added Successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while processing the PDF file.' });
    }

})

app.listen(process.env.PORT || 3000, () => {
    console.log('Server started on port ' + process.env.PORT || 3000);
})