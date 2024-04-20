const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://football.fantasysports.yahoo.com/f1/draftanalysis";

const Yahoo_ADP = async () => {
  const browser: Browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector("table > tbody", {
    timeout: 10000,
  });

  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );

    const data = playerRows.map((player: any) => ({
      rank: player.querySelector("td:nth-child(2) > div").innerText,
      playerName: player.querySelector(
        "td:nth-child(1) > div > div > div > div"
      ).innerText,
      position: player
        .querySelector("td:nth-child(1) > div > div > div > div > span")
        .innerText.trim(),
      team: player
        .querySelector(" td:nth-child(1) > div > div > div > div:nth-child(2) ")
        .innerText.slice(0, -5),
      adp: player.querySelector("td:nth-child(7) > div ").innerText,
      lastSevenDaysADP: player.querySelector(" td:nth-child(8) > div ")
        .innerText,
    }));
    return data;
  });
  console.log(adpData);
  await browser.close();
  fs.writeFile("yahooADP.json", JSON.stringify(adpData), (err: any) => {
    if (err) throw err;
    console.log("The file has been saved!");
  });
};

Yahoo_ADP();
// next page button path
// div[2]/div/button[2]
