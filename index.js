const puppeteer = require('puppeteer');
const natural = require('natural');

// configuration for google search api
const GOOGLE_API_KEY = 'AIzaSyAKnD34Y-v2GxVvM3WuR6fE8OPL6kqCuds'; //api key here
const GOOGLE_CSE_ID = '86f248a0d941d4c0e'; //custom search engine id here

// Function to normalise text
function normaliseText(text) {
  text = text.toLowerCase();
  text = text.replace(/[\.?!]/g, "");
  return text.split(/\s+/);
}

// Function to calculate TF-IDF vectors for a single document
function calculateTFIDF(document) {
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

  for (let word in tf) {
      tf[word] = tf[word] / totalWords;
  }
  return tf;
}

// Function to apply TF-IDF transformation using the TF-IDF vector of a seed article
function applyTFIDFTransformation(seedTFIDF, document) {
  let tfidfVector = {};
  let tf = calculateTFIDF(document);
  for (let word in seedTFIDF) {
      tfidfVector[word] = tf[word] ? tf[word] * seedTFIDF[word] : 0;
  }
  return tfidfVector;
}


//dynamically import node-fetch and perform a search
async function searchGoogle(query) {
  const { default: fetch } = await import('node-fetch'); //install node-fetch if not already done so
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CSE_ID}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items ? data.items.map(item => item.link) : [];
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const seedArticle = 'https://www.bbc.co.uk/news/entertainment-arts-68957553'

  //example: get seed article from specific url
  await page.goto(seedArticle);

  const seedTitle = await page.evaluate(() => document.querySelector('h1').innerText);
  const seedText = await page.evaluate(() => document.querySelector('article').innerText);
  

  const normalisedSeedArticle = normaliseText(seedText);
  const seedTFIDF = calculateTFIDF(normalisedSeedArticle);

  const articleURLs = await searchGoogle(seedTitle); //use title of seed article as search query
  let suggestedArticles = [];

  for (let url of articleURLs){
    await page.goto(url);
    const articleData = await page.evaluate(() => {
      const text = Array.from(document.querySelectorAll('article p')).map(p => p.innerText).join('\n');
      return text;
    });
    let normalisedarticle = normaliseText(articleData);
    let articleTFIDFVector = applyTFIDFTransformation(seedTFIDF, normalisedarticle);
    let totalScore = calculateTotalScore(articleTFIDFVector);
    console.log(`Total score for URL ${url}:`, totalScore);

    if (totalScore > 0){
      let sentimentResult = sentimentAnalysis(normalisedarticle);
      suggestedArticles.push({
        url: url,
        tfidfScore: totalScore,
        sentiment: sentimentResult
      });
    }
  }
  console.log("Suggested Articles:", suggestedArticles);
  await browser.close();
})();

function calculateTotalScore(tfidfVector) {
  let totalScore = 0;
  for (let word in tfidfVector) {
      totalScore += tfidfVector[word];
  }
  return totalScore;
}

//Sentiment analysis NLP
function sentimentAnalysis(articleData) {
  const Analyser = natural.SentimentAnalyzer;
  const stemmer = natural.PorterStemmer;
  const analyser = new Analyser("English", stemmer, "afinn");

  const result = analyser.getSentiment(articleData);
  const humanReadableSentiment = interpretSentiment(result);
  console.log(`Sentiment for article: ${humanReadableSentiment}`);
}

function interpretSentiment(score) {
  if (score > 0.5) return "Strongly Positive";
  if (score > 0) return "Positive";
  if (score === 0) return "Neutral";
  if (score > -0.5) return "Negative";
  return "Strongly Negative";
}