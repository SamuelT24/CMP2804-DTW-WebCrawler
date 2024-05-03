const puppeteer = require('puppeteer');

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

  const seedArticle = 'https://www.bbc.co.uk/news/uk-wales-68920517'

  //example: get seed article from specific url
  await page.goto(seedArticle);

  const seedTitle = await page.evaluate(() => document.querySelector('h1').innerText);
  const seedText = await page.evaluate(() => document.querySelector('article').innerText);
  

  const normalisedSeedArticle = normaliseText(seedText);
  const seedTFIDF = calculateTFIDF(normalisedSeedArticle);

  const articleURLs = await searchGoogle(seedTitle); //use title of seed article as search query

  for (let url of articleURLs){
    await page.goto(url);
    const articleData = await page.evaluate(() => {
      const text = Array.from(document.querySelectorAll('article p')).map(p => p.innerText).join('\n');
      return text;
    });
    let normalisedarticle = normaliseText(seedText);
    let articleTFIDFVector = applyTFIDFTransformation(seedTFIDF, normalisedarticle);
    console.log('TF-IDF Vector for URL ${URL}:', articleTFIDFVector);
  }

  await browser(close)
})();