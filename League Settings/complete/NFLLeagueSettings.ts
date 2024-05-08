require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
// email password league name for sign in path
const email = process.env.NFLUSERNAME;
const password = process.env.NFLPASSWORD;

// need league name for navigation
const leagueName = "Test League";

// if league ID present we can go straight to settings and run scraping
const leagueID = "12239069";

// login page for cbs then url for fantasy for new goto
const homeURL = "https://id.nfl.com/account/sign-in";
const fantasyURL = "https://fantasy.nfl.com/myleagues";
// if league ID present go straight to settings and run scraping
const settingsURL = `https://fantasy.nfl.com/league/${leagueID}/settings`;

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
  // if league id is not available, go to login page and run through log in process
  if (!leagueID) {
    await signInPath(page);
    await scrapeData(page);
  } else {
    await page.goto(settingsURL, { waitUntil: "domcontentloaded" });
    await scrapeData(page);
  }

  await browser.close();
};

const signInPath = async (page) => {
  await page.goto(homeURL, { waitUntil: "domcontentloaded" });
  // email input, continue click
  await page.waitForSelector("#email-input-field");
  await page.type("#email-input-field", `${email}`);
  await page.click(
    "#__next > div > div > div > div > div.css-175oi2r.r-qn3fzs > button"
  );
  // wait for password input to load
  await page.waitForSelector("#password-input-field");
  // password input, sign in click
  await page.type("#password-input-field", `${password}`);
  await page.click(
    "#__next > div > div > div.styles__BodyWrapper-sc-1858ovt-1.ffwlTn > div > div.css-175oi2r.r-knv0ih.r-w7s2jr > button"
  );
  // wait for page load after login, then go to fantasy/myleagues page
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  await page.goto(fantasyURL, { waitUntil: "domcontentloaded" });
  // click on the league drop down menu in the nav bar
  await page.waitForSelector(
    `xpath/html/body/div[1]/div[1]/div/div/div[1]/div[1]/div[2]/div[2]/div[2]/div/div[1]`
  );
  await page.click(
    "xpath/html/body/div[1]/div[1]/div/div/div[1]/div[1]/div[2]/div[2]/div[2]/div/div[1]"
  );
  // click on the league based off league name from drop down menu
  await page.waitForSelector(`a.league-name ::-p-text(${leagueName})`);
  await page.click(`a.league-name ::-p-text(${leagueName})`);

  // get current url and add /settings to go to league settings page
  const url = await page.url();
  await page.goto(url + "/settings", { waitUntil: "domcontentloaded" });
};

const scrapeData = async (page) => {
  // scrape settings info table
  await page.waitForSelector("ul.formItems");

  const rulesData = await page.evaluate(() => {
    const ruleRows = Array.from(document.querySelectorAll("ul.formItems > li"));

    const data = ruleRows.map((rule: any) => ({
      rule: rule.querySelector("em").innerText,
      setting: rule.querySelector("div").innerText,
    }));
    return data;
  });

  // go to owners page
  const url = await page.url();
  const newURL = url.replace("/settings", "/owners");
  await page.goto(newURL, { waitUntil: "domcontentloaded" });

  // // scrape owners info table
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
  fs.writeFileSync(
    "NFLLeagueSettings.json",
    JSON.stringify({ rulesData, ownerData }),
    (err: any) => {
      if (err) throw err;
    }
  );
};

NFL_League_Settings();
