require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
// yahoo league id will give unique url for settings and owners page, league must be set to 'publicly viewable'
const leagueID = "393";
// const with users team name to use in site navigation
// login page for cbs fantasy football w/ redirect to my teams webpage
const settingsURL = `https://football.fantasysports.yahoo.com/f1/${leagueID}/settings`;
const ownersURL = `https://football.fantasysports.yahoo.com/f1/${leagueID}/teams`;

const Yahoo_League_Settings = async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
  );
  await page.goto(settingsURL, { waitUntil: "load" });

  // scrape league settings from league details page
  await page.waitForSelector(
    "xpath/html/body/div[1]/div[2]/div[2]/div[2]/div/div/div[2]/div[2]/section[1]/div/div/div[3]/section[1]/div/table/thead/tr/th[1]"
  );
  const rulesData = await page.evaluate(() => {
    const ruleRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );

    const data = ruleRows.map((rule: any) => ({
      rule: rule.querySelector("td:nth-child(1)").innerText,
      setting: rule.querySelector("td:nth-child(2)").innerText,
    }));
    return data;
  });
  console.log(rulesData);
  fs.writeFileSync(
    "YahooLeagueRules.json",
    JSON.stringify(rulesData),
    (err: any) => {
      if (err) throw err;
    }
  );

  await page.goto(ownersURL, { waitUntil: "domcontentloaded" });

  await page.waitForSelector(
    "xpath/html/body/div[1]/div[2]/div[2]/div[2]/div/div/div[2]/div[2]/section/div/div/div[3]/section/div/table/tbody/tr"
  );

  const ownerData = await page.evaluate(() => {
    const ownerRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );
    // yahoo hides manager name and email without being logged in
    const data = ownerRows.map((owner: any) => ({
      team: owner.querySelector("td:nth-child(1) > a:nth-child(2)").innerText,
      // owner: owner.querySelector("td:nth-child(2) > span > a").innerText,
      // email: owner.querySelector("td:nth-child(3) > a").innerText,
      budget: owner.querySelector("td:nth-child(4)").innerText,
      priority: owner.querySelector("td:nth-child(5)").innerText,
      moves: owner.querySelector("td:nth-child(6)").innerText,
      trades: owner.querySelector("td:nth-child(7)").innerText,
      active: owner.querySelector("td:nth-child(8)").innerText,
    }));
    return data;
  });
  console.log(ownerData);

  fs.writeFileSync(
    "YahooLeagueOwners.json",
    JSON.stringify(ownerData),
    (err): any => {
      if (err) throw err;
    }
  );

  // await browser.close();
};

Yahoo_League_Settings();
