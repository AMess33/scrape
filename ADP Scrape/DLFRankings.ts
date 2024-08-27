require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const username = process.env.DLFUSERNAME;
const password = process.env.DLFPASSWORD;

const homepageURL = "https://dynastyleaguefootball.com/";

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
    slowMo: 10,
    executablePath: executablePath(),
  });

  const page = await browser.newPage();

  await page.goto(homepageURL, { waitUntil: "domcontentloaded" });

  await page.waitForSelector(
    "xpath/html/body/div[1]/section/div/div/div/section[2]/div/div[3]/div/div[2]/div/div/ul/li[2]/a"
  );

  await page.click(
    "xpath/html/body/div[1]/section/div/div/div/section[2]/div/div[3]/div/div[2]/div/div/ul/li[2]/a"
  );
  // process wasn't fulling typing before moving on to next steps, wait 5 seconds for login form load
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await page.waitForSelector(
    "xpath/html/body/div[4]/div/div[2]/div/div/div/form/div[1]/input"
  );

  await page.type(
    "xpath/html/body/div[4]/div/div[2]/div/div/div/form/div[1]/input",
    `${username}`
  );

  await page.type(
    "xpath/html/body/div[4]/div/div[2]/div/div/div/form/div[2]/div/div/input",
    `${password}`
  );

  await page.click(
    "xpath/html/body/div[4]/div/div[2]/div/div/div/form/div[5]/input[1]"
  );
  // allow login submit time to complete and page load
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.goto(draftTypes.url, { waitUntil: "domcontentloaded" });

  await page.waitForSelector(
    "table#avgTable > tbody > tr > td:nth-child(4) > a"
  );

  const rankingsData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll("table#avgTable > tbody > tr")
    );
    // map each row in the table
    const data = playerRows.map((player: any) => ({
      // player rank data saved as rank
      rank: player.querySelector("td:nth-child(1)").innerText,

      playerName: player.querySelector("td:nth-child(4)").innerText,

      positionRank: player.querySelector("td:nth-child(3)").innerText,

      team: player.querySelector("td:nth-child(5)").innerText,

      age: player.querySelector("td:nth-child(6)").innerText,

      avgRank: player.querySelector("td:nth-child(2)").innerText,
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
