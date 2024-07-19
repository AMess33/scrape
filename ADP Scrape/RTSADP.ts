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
    url: "https://www.freedraftguide.com/fantasy-football/average-draft-position?STYLE=1&CHANGE=7",
    lable: "RTS PPR",
  },
  {
    url: "https://www.freedraftguide.com/fantasy-football/average-draft-position?STYLE=600&CHANGE=7",
    lable: "RTS Best Ball",
  },
  {
    url: "https://www.freedraftguide.com/fantasy-football/average-draft-position?STYLE=910&CHANGE=7",
    lable: "RTS TFC",
  },
  {
    url: "https://www.freedraftguide.com/fantasy-football/average-draft-position?STYLE=6&CHANGE=7",
    lable: "RTS Super Flex",
  },
  {
    url: "https://www.freedraftguide.com/fantasy-football/average-draft-position?STYLE=800&CHANGE=7",
    lable: "RTS Dynasty",
  },
];

const RTS_ADP = async (draftTypes: { url: string; lable: string }) => {
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
      // player adp data saved as adp
      adp: player.querySelector("td:nth-child(1)").innerText,
      // player name data saved as playerName
      playerName: player.querySelector("td:nth-child(3) > a").innerText,
      // player position data saved as position
      position: player.querySelector("td:nth-child(4)").innerText.trim(),
      // player team data saved as team
      team: player.querySelector("td:nth-child(5)").innerText.trim(),
      // player bye week saved as bye
      bye: player.querySelector("td:nth-child(6)").innerText.trim(),
    }));
    return data;
  });
  fs.writeFileSync(
    `${draftTypes.lable} ${currentDate}.json`,
    JSON.stringify(adpData),
    (err: any) => {
      if (err) throw err;
    }
  );
  await browser.close();
};
draftTypes.forEach((url) => RTS_ADP(url));
