const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

// establish page number and add till it reaches 5, not working as intended

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://fantasy.espn.com/football/livedraftresults";

(async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url);
  let pageNumber = 1;

  while (pageNumber < 5) {
    await page.waitForSelector(
      "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__athlete.flex > span > a",
      { timeout: 10000 }
    );

    const espnADP = await page.evaluate(() => {
      const playerRows = Array.from(
        document.querySelectorAll(".Table__TBODY > tr")
      );

      const data = playerRows.map((player: any) => ({
        rank: player.querySelector("td:nth-child(1) > div").innerText,
        playerName: player.querySelector(
          "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__athlete.flex > span > a"
        ).innerText,
        position: player.querySelector(
          "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__position.flex > span.playerinfo__playerpos.ttu"
        ).innerText,
        team: player.querySelector(
          "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__position.flex > span.playerinfo__playerteam"
        ).innerText,
        adp: player.querySelector("td:nth-child(3) > div").innerText,
        changeADP: player.querySelector("td:nth-child(4) > div > span")
          .innerText,
        auctionValue:
          "$" + player.querySelector("td:nth-child(5) > div").innerText,
        auctionChange: player.querySelector("td:nth-child(6) > div > span")
          .innerText,
      }));
      return data;
    });

    await page.waitForSelector(".Pagination__Button--next", { visible: true });

    if (pageNumber !== 5) {
      await page.click(".Pagination__Button--next"),
        console.log(pageNumber),
        await page.waitForNavigation({ waitUntil: "networkidle0" });
    } else {
      fs.writeFileSync("espnADP.json", JSON.stringify(espnADP));
    }

    console.log(espnADP);
  }
  pageNumber += 1;

  await browser.close();
})();

// timesout after printing page number line 58
