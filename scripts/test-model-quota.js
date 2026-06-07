const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Missing GOOGLE_GEMINI_API_KEY");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const modelsToTest = [
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-3.1-flash-lite"
];

(async () => {
  for (const modelName of modelsToTest) {
    console.log(`Testing model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello!");
      console.log(`✅ Success for ${modelName}:`, result.response.text().trim());
    } catch (err) {
      console.error(`❌ Error for ${modelName}:`, err.message);
    }
  }
})();
