const puppeteer = require("puppeteer"); // Having issues? Make sure this is installed! It's not a built-in module!
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

const getArticleLink = () => {
  // getArticleLink()
  // This is a temporary function for testing purposes where we can specify
  // an article to test the scraper on. Note that this will be removed once
  // we have a proper GUI up and running.
  return new Promise(resolve => {
    readline.question("Please enter an article to scrape: ", (pageLink) => {
      readline.close();
      resolve(pageLink);
    });
  });
};

(async () => {
  // We generate our puppeteer browser here, then scrape the user specified link.
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // TODO: This works for the time being, but later we should definitely
  // add some exception handling in case the user enters something stupid,
  // or the specified URL is unavailable.
  await page.goto(await getArticleLink());

  const articleData = await page.evaluate(() => {
    // TODO: This is a good start, but on our actual implementation we should probably
    // format this nicer, with some consideration for the potential of subtitles.
    const articleTitle = document.querySelector("h1").innerText;
    const articleText = Array.from(document.querySelectorAll("article p")).map(p => p.innerText).join("\n");

    return {
      title: articleTitle,
      text: articleText
    };
  });

  let dataList = [];
  dataList.push(articleData);

  console.log(dataList); // For the time being, display our dataList by logging it in the console.
  // We'll display this nicer once we have a GUI up and running!

  await browser.close();
})();
