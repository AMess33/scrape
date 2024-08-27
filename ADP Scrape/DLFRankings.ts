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
    url: "https://dynastyleaguefootball.com/rankings/dynasty-rankings",
    lable: "DLF Dynasty Rankings",
  },
  {
    url: "https://dynastyleaguefootball.com/dynasty-superflex-rankings/",
    lable: "DLF Dynasty SuperFlex Rankings",
  },
  {
    url: "https://dynastyleaguefootball.com/dynasty-cornerstone-rankings/",
    lable: "DLF Dynasty Cornerstone Rankings",
  },
  {
    url: "https://dynastyleaguefootball.com/dynasty-rookie-superflex-rankings/",
    lable: "DLF Dynasty Rookie SuperFlex Rankings",
  },
];

const DLF_Rankings = async (draftTypes: { url: string; lable: string }) => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: false,
    executablePath: executablePath(),
  });

  const page = await browser.newPage();
  await page.goto(draftTypes.url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("table > tbody > tr");

  const rankingsData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );
    // map each row in the table
    const data = playerRows.map((player: any) => ({
      // player rank data saved as rank
      rank: player.querySelector("td:nth-child(1)").innerText,
      playerName: player.querySelector("td:nth-child(4)").innerText,
      // player position data saved as position
      positionRank: player.querySelector("td:nth-child(3)").innerText.trim(),
      // player team data saved as team
      team: player.querySelector("td:nth-child(5)").innerText.trim(),
      // player bye week saved as bye
      age: player.querySelector("td:nth-child(6)").innerText.trim(),
      // player points saved as points
      avgRank: player.querySelector("td:nth-child(2)").innerText.trim(),
    }));
    return data;
  });
  fs.writeFileSync(
    `${draftTypes.lable} ${currentDate}.json`,
    JSON.stringify(rankingsData)
  );
  await browser.close();
};
draftTypes.forEach((url) => DLF_Rankings(url));
