const pdf2img = require('pdf-img-convert');
const fs = require('fs');
const sharp = require('sharp');
const { coordinates, voterIdCoordinates, sNoCoordinates } = require('./coordinates.js');
const { createWorker } = require('tesseract.js');
const path = require('path');
var ml2en = require('ml2en');
const pdfCountCalc = require('pdf-page-counter');
const pdfPath = './file.pdf';
const { getName, getGuardianName, getGender, getHouseName, getHouseNo, getAge } = require('./ExtractData');

// Output directory for the images
const outputDirectory = './outputPDF';

// Ensure the output directory exists
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
}


// const convertPDFToImages = async () => {
//     try {
//         let dataBuffer = fs.readFileSync(pdfPath);
//         const pdfResult = await pdfCountCalc(dataBuffer);
//         const pdfTotalPageNo = pdfResult.numpages;
//         for (let index = 3; index < 5; index++) {
//             const Images = await pdf2img.convert(pdfPath, {
//                 width: 2480,
//                 height: 3509,
//                 page_numbers:[index]
//             });
//             Images.forEach(async (image) => {

//              const textArray =   await cropImage(image,index);

//             })

//         }
//     } catch (error) {
//         console.log(error);
//     }
// }
// const convertPDFToImages = async (pdf) => {
//     try {

//         const pdfResult = await pdfCountCalc(pdf);
//         const pdfTotalPageNo = pdfResult.numpages;
//         let compiledTextArray = []; // Initialize an array to compile all text
//         for (let index = 3; index < pdfTotalPageNo-1; index++) {
//             const images = await pdf2img.convert(pdf, {
//                 width: 2480,
//                 height: 3509,
//                 page_numbers: [index]
//             });
//             let round = index - 3;
//             for (let i = 0; i < images.length; i++) {
//                 const textArray = await cropImage(images[i], round); // Wait for each image to be processed
//                 compiledTextArray = [...compiledTextArray, ...textArray];
//             }
//         }
//         return compiledTextArray;
//     } catch (error) {

//         console.error("Error in convertPDFToImages:", error);

//     }
// };
let numberSNo = 0;
const convertPDFToImages = async (pdf) => {
    try {
        const pdfResult = await pdfCountCalc(pdf);
        const pdfTotalPageNo = pdfResult.numpages;
        let compiledTextArray = []; // Initialize an array to compile all text

        for (let index = 3; index < pdfTotalPageNo - 1; index++) {
            const images = await pdf2img.convert(pdf, {
                width: 2480,
                height: 3509,
                page_numbers: [index]
            });
            let round = index - 3;

            // Use Promise.all to process all images in parallel for the current page
            const pageTextPromises = images.map((image) => cropImage(image, round));
            const pageTextArrays = await Promise.all(pageTextPromises);

            // Flatten the array of arrays into a single array and merge with compiledTextArray
            compiledTextArray = compiledTextArray.concat(...pageTextArrays);
        }

        return compiledTextArray;
    } catch (error) {
        console.error("Error in convertPDFToImages:", error);
    }
};

const cropImage = async (image, something) => {
    try {
        console.log(something);
        const imageBuffer = Buffer.from(image, 'base64');
        // Use Promise.all to wait for all cropping and OCR operations to complete
        const userData = await Promise.all(coordinates.map(async (coordinate) => {
            const croppedImageBuffer = await sharp(imageBuffer)
                .extract({
                    width: coordinate.width,
                    height: coordinate.height,
                    left: coordinate.left,
                    top: coordinate.top
                })
                .toBuffer(); // Get a buffer of the cropped image
            const text = await makeOCRDataMal(croppedImageBuffer); // Pass the buffer directly to the OCR function
            const engtext = await makeOCRDataEng(croppedImageBuffer); // Pass the buffer directly to the OCR function
            if (!text) {
                return
            }
            if (!engtext) {
                return
            }
            const name = getName(text) ? getName(text) : "";
            const guardianName = getGuardianName(text) ? getGuardianName(text) : "";
            let gender = getGender(text) ? getGender(text) : "";
            let houseName = getHouseName(text) ? getHouseName(text) : "";
            const houseNo = getHouseNo(engtext) ? getHouseNo(engtext) : "";
            const age = getAge(engtext) ? getAge(engtext) : "";

            return {
                name: name ? ml2en(name) : "",
                guardianName: guardianName ? ml2en(guardianName) : "",
                gender: gender ? ml2en(gender) : "N",
                houseName: houseName ? ml2en(houseName) : "",
                houseNo: houseNo ? ml2en(houseNo) : "",
                age: age ? ml2en(age) : ""
            }
        }));
        // Use Promise.all to wait for all cropping and OCR operations to complete
        const VoterId = await Promise.all(voterIdCoordinates.map(async (coordinate) => {
            const croppedImageBuffer = await sharp(imageBuffer)
                .extract({
                    width: coordinate.width,
                    height: coordinate.height,
                    left: coordinate.left,
                    top: coordinate.top
                })
                .toBuffer(); // Get a buffer of the cropped image
            const text = await makeOCRDataVoterId(croppedImageBuffer); // Pass the buffer directly to the OCR function
            let voterId = text.replace(/\n/g, ''); // Remove newline character
            //change the sNo to number and get only number and save it as number
            voterId = voterId.replace(/O&/g, 'Q'); // Replace "O&" with "Q"
            voterId = voterId.split(' ')[0]; // Split the string and get the first part
            return voterId;
        }));

        //create text array from text image

        const textArray = userData.filter(text => text !== ""); // Remove empty strings from array
        const voterIdArray = VoterId.filter(text => text !== ""); // Remove empty strings from array
        // Remove empty strings from array
        //combain text and voterId
        let nullCount = 0;
        const combinedArray = textArray.map((text, index) => {
            // One round = 30 data
            let round = something * 30;
            if (!text) {
                nullCount++; // Increment nullCount for each null entry
                return undefined; // Skip this entry
            }

            // Calculate the serial number, adjusting for any previous null entries
            //     let sNo = ((index + 1) + round)
            //   sNo = sNo - nullCount;
            numberSNo++;
            let sNo = numberSNo
            // Construct the data object for this entry
            const dataObj = {
                sNo,
                ...text,
                voterId: voterIdArray[index],
            };
            // Do not reset nullCount here; it's used continuously to adjust sNo
            return dataObj;
        }).filter(entry => entry !== undefined); // Filter out the skipped (undefined) entries

        return combinedArray;

    } catch (error) {
        console.error("Error in cropImage:", error);
    }
};

const makeOCRDataMal = async (imageBuffer) => {
    const worker = await createWorker("mal");

    try {
        const { data: { text } } = await worker.recognize(imageBuffer);
        // Optionally, save OCR text to a file. Here, you'd need a filename or path.
        // fs.writeFileSync(`./outputOCR/${Date.now()}.txt`, text);
        return text;
    } catch (error) {
        console.error('Error performing OCR:', error);
        return ''; // Return an empty string or appropriate error message
    } finally {
        await worker.terminate();
    }
};
const makeOCRDataEng = async (imageBuffer) => {
    const worker = await createWorker("eng");

    try {
        const { data: { text } } = await worker.recognize(imageBuffer);
        // Optionally, save OCR text to a file. Here, you'd need a filename or path.
        // fs.writeFileSync(`./outputOCR/${Date.now()}.txt`, text);
        return text;
    } catch (error) {
        console.error('Error performing OCR:', error);
        return ''; // Return an empty string or appropriate error message
    } finally {
        await worker.terminate();
    }
};
const makeOCRDataVoterId = async (filePath) => {
    const worker = await createWorker("eng");
    try {
        const { data: { text } } = await worker.recognize(filePath);
        return text
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await worker.terminate(); // Make sure to terminate the worker
    }
};
const pdftoJson = (pdf) => {
    return new Promise((resolve, reject) => {
        convertPDFToImages(pdf)
            .then(finalArray => {
                numberSNo = 0;
                resolve(finalArray);
            })
            .catch(error => {
                numberSNo = 0;
                reject(error);
            });
    });
};

module.exports = {
    pdftoJson
}