require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const username = process.env.DKUSERNAME;
const password = process.env.DKPASSWORD;
const url =
  "https://myaccount.draftkings.com/login?returnPath=%2Fdraft%2Frankings%2Fnfl%2F";
// will need to send headers to avoid sign in

// scrape for adp data
const Draft_Kings_ADP = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setGeolocation({ latitude: 39, longitude: -94 });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(
    "https://www.draftkings.com/draft/rankings/nfl",
    ["geolocation"]
  );
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  await page.waitForSelector("#login-username-input");
  await page.type("#login-username-input", `${username}`);
  await page.type("#login-password-input", `${password}`);
  await page.click("#login-submit");

  // await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.waitForSelector("div.row > div:nth-child(2)");

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
