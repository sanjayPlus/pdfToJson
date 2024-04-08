const getName = (text) => {
    try {
        const lines = text.split('\n');
        const parts = lines.length > 0 ? lines[0].split(':') : [];
        return parts.length > 1 ? parts[1].trim() : ""; // Return the trimmed value only if it exists
    } catch (splitError) {
        console.error("Error in getName:", splitError);
        return ""; // Return empty string in case of an error during splitting
    }
  };
  

const getGuardianName = (text) => {
    try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length >= 2) {
            const parts = lines[1].split(':');
            if (parts.length >= 2) {
                return parts[1].trim();
            }
        }
        return ""; // Return empty string if guardian's name cannot be found
    } catch (error) {
        console.error("Error in getGuardianName:", error);
        return ""; // Return empty string in case of an error
    }
};

const getGender = (text) => {
    try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.split(' ');
        const gender = parts[parts.length - 1].trim();
        if (gender.includes('പ')) {
            return 'M';
        } else if (gender.includes('സ')) {
            return 'F';
        } else {
            return 'N'; // Return 'N' for not known
        }
    } catch (error) {
        console.error("Error in getGender:", error);
        return ""; // Return empty string in case of an error
    }
};


const getHouseName = (text) => {
  try {
      // get the text from 3rd line

      const lines = text.split('\n').filter(line => line.trim() !== '');
      if(lines.length === 4) {
          const thirdLine = lines[2] || '';
          //remove the number from the string
          let valuePortion = thirdLine.split(':')[1]  || '';
          //get the last word from the string
          let words = valuePortion.split(' ') || [];
          let newValue = words[words.length - 1];
          return newValue ? newValue.trim() : "";
      }else if(lines.length === 5) {
          const thirdLine = lines[2] || '';
          const forthLine = lines[3] || '';
          //remove the number from the string
          const nonNumberValue = removeNumbers(thirdLine);
          //get the last word from the string
          let valuePortion = nonNumberValue.split(':')[1]  || '';
              let words = valuePortion.split(' ') || [];
              let newValue = words[words.length - 1];
           let value = newValue ? newValue.trim() : "";
           return value+" "+forthLine;
      }else{
          return "";
      }

  } catch (error) {
      console.error("Error in getHouseName:", error);
      return ""; // Return empty string in case of an error
  }
};
const removeNumbers = (text) => {
  // Regular expression to match numbers and fractions
  const regex = /\d+\/\d+|\d+/g;
  // Replace numbers and fractions in the text with an empty string
  const newText = text.replace(regex, '');
  return newText;
};
  const getHouseNo = (text) => {
    try {
        // get the text from 3rd line
  
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const thirdLine = lines[2] || '';
        let numberFromtext = extractNumbers(thirdLine);
  
        return numberFromtext[0];
  
    } catch (error) {
        console.error("Error in getHouseName:", error);
        return ""; // Return empty string in case of an error
    }
  };
  const getAge = (text) => {
    try {
      //get the last line from the text and split it by spaces
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const lastLine = lines[lines.length - 1];
      let numberFromtext = extractNumbers(lastLine);
      //return the number which is greater than 18
      numberFromtext = numberFromtext.filter(num => num >= 18);
      return numberFromtext[0];
    } catch (error) {
      console.error("Error in getAge:", error);
      return "";
    }
  }
  const extractNumbers = (text) => {
    // Regular expression to match numbers and fractions
    const regex = /\d+\/\d+|\d+/g;
    // Match numbers in the text using the regex
    const numbersArray = text.match(regex);
    // If numbers are found, return them as an array of strings
    // If no numbers are found, return an empty array
    return numbersArray || [];
  };
  
module.exports = { getName, getGuardianName, getGender, getHouseName , getHouseNo, getAge};
