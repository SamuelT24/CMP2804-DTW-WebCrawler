// Function to calculate TF-IDF vectors for a single document
function calculateTFIDF(document) {
    // Calculate term frequency (TF)
    let tf = {};
    let totalWords = 0;
    document.forEach(word => {
        totalWords++;
        if (tf[word]) {
            tf[word] += 1;
        } else {
            tf[word] = 1;
        }
    });

    // Normalize TF
    for (let word in tf) {
        tf[word] = tf[word] / totalWords;
    }

    return tf;
}

// Function to apply TF-IDF transformation on a list of documents using the TF-IDF vector of a seed article
function applyTFIDFTransformation(seedTFIDF, documents) {
    let tfidfVectors = [];
    documents.forEach(document => {
        let tfidfVector = {};
        let tf = calculateTFIDF(document);
        for (let word in seedTFIDF) {
            if (tf[word]) {
                tfidfVector[word] = tf[word] * seedTFIDF[word];
            } else {
                tfidfVector[word] = 0;
            }
        }
        tfidfVectors.push(tfidfVector);
    });
    return tfidfVectors;
}

// Function to normalise text
function normaliseText(text) {
    // Convert text to lowercase
    text = text.toLowerCase();
    
    // Remove punctuation
    let punctuation = /[\.?!]/g;
    text = text.replace(punctuation, "");

    // Split text into words
    let words = text.split(" ");
    return words;
}

// Example usage
// Seed article
let seedArticle = "This is the seed article for TF-IDF vectorization.";
seedArticle = normaliseText(seedArticle);

// List of web scraped articles
let scrapedArticles = [
    "This is the first web scraped article.",
    "This is the second web scraped article.",
    "And this is the third web scraped article."
];
scrapedArticles = scrapedArticles.map(normaliseText); // Apply normalisation function to each article

// Calculate TF-IDF vector for the seed article
const seedTFIDF = calculateTFIDF(seedArticle);

// Apply TF-IDF transformation on the list of web scraped articles
const transformedArticles = applyTFIDFTransformation(seedTFIDF, scrapedArticles);
console.log(transformedArticles);


