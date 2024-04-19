const puppeteer = require('puppeteer');

// configuration for google search api
const GOOGLE_API_KEY = 'AIzaSyAKnD34Y-v2GxVvM3WuR6fE8OPL6kqCuds'; //api key here
const GOOGLE_CSE_ID = '86f248a0d941d4c0e'; //custom search engine id here

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

  // define search query
  const query = 'porsche 911 news'; // example query
  const articleUrls = await searchGoogle(query);

  let dataList = [];

  for (let url of articleUrls) {
    await page.goto(url);

    // scrape title and article text
    const articleData = await page.evaluate(() => {
      const articleTitle = document.querySelector('h1') ? document.querySelector('h1').innerText : 'No title found';
      const articleText = Array.from(document.querySelectorAll('article p')).map(p => p.innerText).join('\n');
      return {
        title: articleTitle,
        text: articleText
      };
    });

    dataList.push(articleData);
  }

  console.log(dataList);

  await browser.close();
})();