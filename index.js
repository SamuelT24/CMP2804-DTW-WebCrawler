const puppeteer = require('puppeteer');
const natural = require('natural');
const nlp = require('compromise');

// configuration for google search api
const GOOGLE_API_KEY = 'AIzaSyAKnD34Y-v2GxVvM3WuR6fE8OPL6kqCuds'; //api key here
const GOOGLE_CSE_ID = '86f248a0d941d4c0e'; //custom search engine id here

// Function to normalise text
function normaliseText(text) {
  text = text.toLowerCase();
  text = text.replace(/[\.?!]/g, "");
  words = text.split(/\s+/);

  //Stemmer to reduce words to their root form NLP
  const stemmer = natural.PorterStemmer;
  words = words.map(word => stemmer.stem(word));
  return words;
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

//Function to calculate the total tf-idf score 
function calculateTotalScore(tfidfVector) {
  let totalScore = 0;
  for (let word in tfidfVector) {
      totalScore += tfidfVector[word];
  }
  return totalScore;
}

//Sentiment analysis NLP using natural.js
function sentimentAnalysis(articleData) {
  const Analyser = natural.SentimentAnalyzer;
  const analyser = new Analyser("English", null, "afinn");

  const result = analyser.getSentiment(articleData);

  //Converts sentiment score to string
  const humanReadableSentiment = result > 0 ? "Positive" : result < 0 ? "Negative" : "Neutral";
  
  return humanReadableSentiment;
}

//Function to extract keywords.
function extractKeywords(text) {
  const doc = nlp(text);
  const keywords = doc.nouns().out('array');
  //remove common stop words.
  const stopWords = ['a', 'an', 'the', 'and', 'is', 'in', 'it', 'you', 'that', 'of', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'from', 'or', 'one', 'had', 'by', 'not', 'but', 'what', 'all', 'your', 'when', 'out', 'up', 'no', 'she', 'he', 'which', 'their', 'if', 'there', 'about', 'get', 'will', 'can', 'her', 'all', 'would', 'my', 'like', 'so', 'them', 'other', 'into', 'see', 'time', 'could', 'now', 'than', 'its', 'only', 'think', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'];
  const filteredKeywords = keywords.filter(word => !stopWords.includes(word));

  return keywords.join(' ');
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

  const seedArticle = 'https://www.theguardian.com/politics/2024/apr/29/humza-yousafs-unravelling-tenure-shows-how-short-and-brutish-political-lives-have-become'

  //example: get seed article from specific url
  await page.goto(seedArticle);

  //Seed article contents
  const seedTitle = await page.evaluate(() => document.querySelector('h1').innerText);
  const seedText = await page.evaluate(() => document.querySelector('article').innerText);
  
  //Normalise seed article
  const normalisedSeedArticle = normaliseText(seedText);

  //Calculate seed tf and sentiment
  const seedTFIDF = calculateTFIDF(normalisedSeedArticle);
  const seedArticleSentiment = sentimentAnalysis(normalisedSeedArticle); //calculate sentiment of seed article

  const extractedTitle = extractKeywords(seedTitle);
  console.log (extractedTitle);
  const articleURLs = await searchGoogle(extractedTitle); //use title of seed article as search query
  let suggestedArticles = [];

  for (let url of articleURLs){
    await page.goto(url);
    const articleData = await page.evaluate(() => {
      const text = Array.from(document.querySelectorAll('article p')).map(p => p.innerText).join('\n');
      return text;
    });

    //Normalise scraped articles
    let normalisedarticle = normaliseText(articleData);

    //Calculate articles tf-idf and sentiment
    let articleTFIDFVector = applyTFIDFTransformation(seedTFIDF, normalisedarticle);
    let totalScore = calculateTotalScore(articleTFIDFVector);
    let articleSentiment = sentimentAnalysis(normalisedarticle);

    console.log(`Total score for URL ${url}:`, totalScore, "Sentiment:", articleSentiment);

    //Add eligible articles to suggested articles array
    if (totalScore > 0 && articleSentiment !== seedArticleSentiment){
      suggestedArticles.push({
        url: url,
        tfidfScore: totalScore,
        sentiment: articleSentiment
      });
    }
  }
  
  console.log("Suggested Articles:", suggestedArticles);
  await browser.close();
})();



