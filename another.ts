const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
const url = "https://fantasy.espn.com/football/livedraftresults";
let tablePage = [
  {
    name: "page1",
    selector: "nav > div > ul > li:nth-child(1)",
  },
  {
    name: "page2",
    selector: "nav > div > ul > li:nth-child(2)",
  },
  {
    name: "page3",
    selector: "nav > div > ul > li:nth-child(3)",
  },
  {
    name: "page4",
    selector: "nav > div > ul > li:nth-child(4)",
  },
  {
    name: "page5",
    selector: "nav > div > ul > li:nth-child(5)",
  },
];

const ESPN_ADP = async (tablePage: { name: string; selector: string }) => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url);

  await page.waitForSelector(".Pagination__Button--next", { timeout: 10000 });
  await page.click(`${tablePage.selector}`);
  // await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.log(`${tablePage.selector}`);

  await page.waitForSelector("td:nth-child(1) > div", { timeout: 10000 });

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
      changeADP: player.querySelector("td:nth-child(4) > div > span").innerText,
      auctionValue:
        "$" + player.querySelector("td:nth-child(5) > div").innerText,
      auctionChange: player.querySelector("td:nth-child(6) > div > span")
        .innerText,
    }));
    return data;
  });

  fs.writeFileSync(
    `${tablePage.name} ${currentDate}.json`,
    JSON.stringify(espnADP),
    (err: any) => {
      if (err) throw err;
      console.log("The file has been saved!");
    }
  );
  console.log(espnADP);
  await browser.close();
};

tablePage.forEach((tablePage) => ESPN_ADP(tablePage));
