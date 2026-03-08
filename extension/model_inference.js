/**
 * Aegis Edge - Client-side AI Inference
 * Loads the quantized TFJS model and performs inference completely offline.
 */

// We assume tfjs is injected before this script via manifest content_scripts
const MODEL_URL = chrome.runtime.getURL("model/model.json");
const VOCAB_URL = chrome.runtime.getURL("model/vocab.json");
let model = null;
let wordIndex = null;

// Initialize the model
async function initModel() {
    try {
        console.log("Loading Aegis Edge classification model and vocabulary...");
        const [loadedModel, vocabResponse] = await Promise.all([
            tf.loadLayersModel(MODEL_URL),
            fetch(VOCAB_URL)
        ]);

        if (!vocabResponse.ok) {
            throw new Error(`Failed to load vocab.json (status ${vocabResponse.status})`);
        }

        model = loadedModel;
        wordIndex = await vocabResponse.json();
        console.log("Model and vocabulary loaded successfully.");
    } catch (error) {
        console.error("Failed to load AI assets:", error);
    }
}

const maxLen = 500;
function tokenizeAndPad(text) {
    text = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = text.split(/\s+/).slice(0, maxLen);

    // Use exact ids from Python tokenizer; unknown words map to 0.
    let seq = words.map(word => Number(wordIndex[word]) || 0);

    // Pad with zeroes
    while (seq.length < maxLen) {
        seq.push(0);
    }

    return tf.tensor2d([seq], [1, maxLen]);
}

/**
 * Executes a prediction.
 * Returns true if text is malicious, false otherwise.
 */
async function isPhishing(text) {
    if (!model) await initModel();
    if (!model || !wordIndex) return false;

    const tensor = tokenizeAndPad(text);
    const predictionResult = model.predict(tensor);
    const prob = predictionResult.dataSync()[0];

    // Cleanup tensor
    tensor.dispose();
    predictionResult.dispose();

    // Threshold for classification
    return prob > 0.85;
}

// Automatically init model on load
initModel();
