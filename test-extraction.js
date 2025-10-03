// test-extraction.js - Script to test the PDF extraction functionality
const path = require('path');
const fs = require('fs');
const enhancedExtractor = require('./backend/services/extractors/enhancedExtractor');

async function testExtraction() {
  try {
    console.log('Testing PDF extraction functionality...');
    
    // Find a test PDF file
    const provasDir = path.join(__dirname, 'Provas e gabaritos');
    
    // Check if the directory exists
    if (!fs.existsSync(provasDir)) {
      throw new Error(`Directory does not exist: ${provasDir}`);
    }
    
    // Get a list of PDF files to test
    const files = fs.readdirSync(provasDir).filter(file => path.extname(file).toLowerCase() === '.pdf');
    
    if (files.length === 0) {
      throw new Error(`No PDF files found in ${provasDir}`);
    }
    
    // Use a specific ENEM PDF file which is likely to have cleaner format
    const testFile = files.find(f => f.includes('_PV_impresso_D1_') || f.includes('2021_PV_impresso')) || files[0];
    const testFilePath = path.join(provasDir, testFile);
    
    console.log(`Attempting to extract from: ${testFilePath}`);
    
    // Check if the file exists
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file does not exist: ${testFilePath}`);
    }
    
    console.log('File exists, starting extraction...');
    
    // Test extraction
    const result = await enhancedExtractor.extract(testFilePath);
    
    console.log('Extraction completed successfully!');
    console.log('Results:');
    console.log(`- Total questions: ${result.questoes.length}`);
    console.log(`- Exam type: ${result.examType}`);
    console.log(`- Validation:`, result.validation);
    
    if (result.questoes.length > 0) {
      console.log('\nFirst question example:');
      console.log(`- Number: ${result.questoes[0].numero}`);
      console.log(`- Subject: ${result.questoes[0].materia}`);
      console.log(`- Year: ${result.questoes[0].ano}`);
      console.log(`- Alternatives count: ${Object.keys(result.questoes[0].alternativas).length}`);
      console.log(`- Difficulty: ${result.questoes[0].dificuldade}`);
      console.log(`- Has correct answer: ${!!result.questoes[0].resposta_correta}`);
    }
    
  } catch (error) {
    console.error('Error during extraction test:', error.message);
    console.error('Stack:', error.stack);
    
    // Check if the enhancedExtractor is properly exported
    console.log('Checking enhancedExtractor object:', typeof enhancedExtractor);
    if (enhancedExtractor && typeof enhancedExtractor.extract === 'function') {
      console.log('extract function exists');
    } else {
      console.log('extract function does not exist');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testExtraction()
    .then(() => {
      console.log('Test completed successfully');
    })
    .catch((error) => {
      console.error('Test failed:', error);
    });
}

module.exports = testExtraction;