const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

let draftTypes = [
  {
    url: "https://www.cbssports.com/fantasy/football/draft/averages/both/h2h/all/",
    lable: "CBS Standard",
  },
  {
    url: "https://www.cbssports.com/fantasy/football/draft/averages/ppr/both/h2h/all/",
    lable: "CBS PPR",
  },
];

const CBS_ADP = async (draftTypes: { url: string; lable: string }) => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(draftTypes.url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("table > tbody > tr");

  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );
    // map each row in the table
    const data = playerRows.map((player: any) => ({
      // player rank data saved as rank
      rank: player.querySelector("td:nth-child(1)").innerText,
      playerName: player.querySelector(
        "td:nth-child(2) > span.CellPlayerName--long > span > a"
      ).innerText,
      // player position data saved as position
      position: player
        .querySelector(
          "td:nth-child(2) > span.CellPlayerName--long > span > span.CellPlayerName-position"
        )
        .innerText.trim(),
      // player team data saved as team
      team: player
        .querySelector(
          "td:nth-child(2) > span.CellPlayerName--long > span > span.CellPlayerName-team"
        )
        .innerText.trim(),
      // player adp data saved as adp
      adp: player.querySelector("td:nth-child(4)").innerText,
    }));
    return data;
  });

  console.log(adpData);
  await browser.close();
  fs.writeFileSync(
    `${draftTypes.lable} ${currentDate}.json`,
    JSON.stringify(adpData),
    (err: any) => {
      if (err) throw err;
      console.log("The file has been saved!");
    }
  );
};

draftTypes.forEach((url) => CBS_ADP(url));
