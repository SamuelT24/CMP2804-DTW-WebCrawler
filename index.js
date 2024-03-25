const puppeteer = require('puppeteer');

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the target webpage
  await page.goto('https://www.theguardian.com/world/2024/mar/24/new-islamic-state-videos-back-claim-it-carried-out-moscow-concert-hall-attack');

  // Scrape the title and article text
  const articleData = await page.evaluate(() => {
    const articleTitle = document.querySelector('h1').innerText;
    const articleText = Array.from(document.querySelectorAll('article p')).map(p => p.innerText).join('\n');

    return {
      title: articleTitle,
      text: articleText
    };
  });

  // Define a list to hold your scraped data and append the article data to it
  let dataList = [];
  dataList.push(articleData);

  console.log(dataList);

  // Close the browser
  await browser.close();
})();
