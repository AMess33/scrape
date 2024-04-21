const puppeteer = require("puppeteer");

// call scrape function inside launch browser function based on next page button status
let firstPlayer = "";
async function scrapePage(page) {
  await page.waitForSelector(".Table__TBODY > tr", { timeout: 10000 });

  const playerRows = await page.$$(".Table__TBODY > tr");

  if (playerRows.length > 0) {
    for (const player of playerRows) {
      const rank = await player.$eval(
        "td:nth-child(1) > div",
        (el) => el.innerText,
        player
      );
      const playerName = await player.$eval(
        "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__athlete.flex > span > a",
        (el) => el.innerText,
        player
      );
      const position = await player.$eval(
        "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__position.flex > span.playerinfo__playerpos.ttu",
        (el) => el.innerText,
        player
      );
      const team = await player.$eval(
        "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__position.flex > span.playerinfo__playerteam",
        (el) => el.innerText,
        player
      );
      const adp = await player.$eval(
        "td:nth-child(3) > div",
        (el) => el.innerText,
        player
      );
      const changeADP = await player.$eval(
        "td:nth-child(4) > div > span",
        (el) => el.innerText,
        player
      );
      const auctionValue = await player.$eval(
        "td:nth-child(5) > div",
        (el) => el.innerText,
        player
      );
      const auctionChange = await player.$eval(
        "td:nth-child(6) > div > span",
        (el) => el.innerText,
        player
      );

      console.log(player.value);
    }
  } else {
    console.log("No players found on the page.");
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://fantasy.espn.com/football/livedraftresults");
  await scrapePage(page);
  let lastPageReached = false;

  while (!lastPageReached) {
    const nextPageLink = await page.$("Button.Pagination__Button--next");
    // let currentPlayer = await page.$eval(
    //   "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__athlete.flex > span > a"
    // );
    if (!nextPageLink) {
      console.log("Last page reached.");
      lastPageReached = true;
    } else {
      await nextPageLink.click();
      // await page.waitForNavigation(firstPlayer !== currentPlayer);
      await scrapePage(page);
    }
  }
  await browser.close();
})();
