require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
// users yahoo username and password
const username = process.env.USERNAMEY;
const password = process.env.PASSWORDY;

// users league name needed for site navigation
const leagueName = "KCMFC Fantasy League";
// sign in then redirect to fantsy football home page
const signInURL = `https://login.yahoo.com/config/login?.intl=us&.lang=en-US&.src=ym&.done=https://football.fantasysports.yahoo.com`;

const Yahoo_League_Settings = async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  // if account does not have 2FA activated nothing needed here
  // if 2fa enabled will need to pass cookies into browser instance to access leagues page
  // page.setcookies();
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
  );
  // sign in pathing w/ redirect to fantasy football home page
  await page.goto(signInURL, { waitUntil: "load" });
  await page.waitForSelector("#login-username");
  await page.type("#login-username", `${username}`);
  await page.click("#login-signin");
  await page.waitForSelector("#login-passwd");
  await page.type("#login-passwd", `${password}`);
  await page.click("#login-signin");

  // click on league from my leagues table
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  await page.waitForSelector(`section#home-myleagues ::-p-text(${leagueName})`);
  await page.click(`section#home-myleagues ::-p-text(${leagueName})`);
  // grab league url and go to /settings page
  const url = await page.url();
  await page.goto(url + "/settings", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text/League ID#:");
  // scrape league settings from league details page

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
  // grab current url and replace settings with teams to go to the teams page and scrape owner info
  const settingsURL = await page.url();
  const teamsURL = settingsURL.replace("/settings", "/teams");
  await page.goto(teamsURL, { waitUntil: "domcontentloaded" });

  await page.waitForSelector(
    "xpath/html/body/div[1]/div[2]/div[2]/div[2]/div/div/div[2]/div[2]/section/div/div/div[3]/section/div/table/tbody/tr"
  );
  // scrape owner table
  const ownerData = await page.evaluate(() => {
    const ownerRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );
    const data = ownerRows.map((owner: any) => ({
      team: owner.querySelector("td:nth-child(1) > a:nth-child(2)").innerText,
      owner: owner.querySelector("td:nth-child(2) > span > a").innerText,
      email: owner.querySelector("td:nth-child(3) > a").innerText,
      budget: owner.querySelector("td:nth-child(4)").innerText,
      priority: owner.querySelector("td:nth-child(5)").innerText,
      moves: owner.querySelector("td:nth-child(6)").innerText,
      trades: owner.querySelector("td:nth-child(7)").innerText,
      active: owner.querySelector("td:nth-child(8)").innerText,
    }));
    return data;
  });
  // write json file with rules and owner data
  fs.writeFileSync(
    "YahooLeagueSettings.json",
    JSON.stringify({ rulesData, ownerData }),
    (err): any => {
      if (err) throw err;
    }
  );

  await browser.close();
};

Yahoo_League_Settings();
