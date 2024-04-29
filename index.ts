require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const ypassword = process.env.PASSWORDY;
const leagueID = "11864040";
// login page for cbs fantasy football w/ redirect to my teams webpage
const settingsURL = `https://fantasy.nfl.com/league/${leagueID}/settings`;
const ownersURL = `https://fantasy.nfl.com/league/${leagueID}/owners`;

const NFL_League_Settings = async () => {
  // if user knows league id, go directly to league settings page/ if not, set up log in routes to league settings page
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
  );
  await page.goto(settingsURL, { waitUntil: "domcontentloaded" });

  await page.waitForSelector(
    "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[1]/div/div/div[1]/ul"
  );

  const rulesData = await page.evaluate(() => {
    const ruleRows = Array.from(document.querySelectorAll("ul.formItems > li"));

    const data = ruleRows.map((rule: any) => ({
      rule: rule.querySelector("em").innerText,
      setting: rule.querySelector("div").innerText,
    }));
    return data;
  });
  console.log(rulesData);
  fs.writeFileSync(
    "NFLLeagueRules.json",
    JSON.stringify(rulesData),
    (err: any) => {
      if (err) throw err;
    }
  );
  await page.goto(ownersURL, { waitUntil: "domcontentloaded" });

  // scrape owners info table
  await page.waitForSelector("div.tableWrap > table > tbody > tr");

  const ownerData = await page.evaluate(() => {
    const ownerRows = Array.from(
      document.querySelectorAll("div.tableWrap > table > tbody > tr")
    );

    const data = ownerRows.map((owner: any) => ({
      team: owner.querySelector("td:nth-child(1) > div > a:nth-child(2)")
        .innerText,
      manager: owner.querySelector("td:nth-child(2) > ul > li > span")
        .innerText,
      waiver: owner.querySelector("td:nth-child(4)").innerText,
      moves: owner.querySelector("td:nth-child(5)").innerText,
      trades: owner.querySelector("td:nth-child(6)").innerText,
      lastActivity: owner.querySelector("td:nth-child(7)").innerText,
    }));
    return data;
  });
  console.log(ownerData);
  fs.writeFileSync(
    "NFLLeagueOwners.json",
    JSON.stringify(ownerData),
    (err: any) => {
      if (err) throw err;
    }
  );
  await browser.close();
};

NFL_League_Settings();
