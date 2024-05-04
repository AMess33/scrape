const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://www.draftkings.com/draft/rankings/nfl/";
// will need to send headers to avoid sign in

// scrape for adp data
const Draft_Kings_ADP = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0",
  });
  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(document.querySelectorAll("div.row"));
    // map each row in the table
    const data = playerRows.map((player: any) => ({
      rank: player.querySelector("div:nth-child(2)").innerText,
      playerName: player.querySelector("div.PlayerCell_player-name").innerText,
      position: player.querySelector("div.player-position").innerText,
      team: player.querySelector("div.player-team > div").innerText,
      adp: player.querySelector("div:nth-child(6) > div > span > span")
        .innerText,
    }));
    return data;
  });
  console.log(adpData);
};

Draft_Kings_ADP();
