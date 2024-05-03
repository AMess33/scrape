require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const leagueName = "Wisconsin Fantasy Football League";
// login page for cbs fantasy football w/ redirect to my teams webpage
const url =
  "https://www.cbssports.com/user/login/?redirectUrl=https%3A%2F%2Fwww.cbssports.com%2Ffantasy%2Fgames%2Fmy-teams%2F";

const CBS_League_Settings = async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "load" });

  // enter login credentials and click login
  await page.type(
    "xpath/html/body/div[2]/div[4]/div/main/div/div[1]/form/div[1]/input",
    `${username}`
  );
  await page.type(
    "xpath/html/body/div[2]/div[4]/div/main/div/div[1]/form/div[2]/input",
    `${password}`
  );

  // click login button after entering credentials
  await page.click("#app_login > div:nth-child(10) > button");

  // wait for navigation to my teams page
  // use users team name to select correct team
  await page.waitForSelector(`text/${leagueName}`);

  await page.click(`text/${leagueName}`);

  // hover over the League nav tab
  await page.waitForSelector(
    "#fantNavContainer > div > div > div.fantNavBar > div.fantNavFastFacts > ul > li.fantNavItem.fant-drop.selected.drop.main-nav"
  );
  await page.hover(
    "#fantNavContainer > div > div > div.fantNavBar > div.fantNavFastFacts > ul > li.fantNavItem.fant-drop.selected.drop.main-nav"
  );

  // click on league details from drop down
  await page.waitForSelector("text/League Details", { timeout: 10000 });
  await page.click("text/League Details");

  // scrape league settings from league details page
  // league identity/ roster limits/ scoring system/ draft settings
  await page.waitForSelector(
    "xpath/html/body/div[2]/div[6]/div[1]/div/div[2]/div[2]/div[1]/div[1]/div[2]/div/div/div/table/tbody/tr[1]/th[1]"
  );
  const leagueIDData = await page.evaluate(() => {
    const ruleRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );

    const data = ruleRows.map((rule, index) => {
      if (index === 0) {
        const headers = Array.from(rule.querySelectorAll("th"));
        return null;
      } else {
        const cells = Array.from(rule.querySelectorAll("td"));
        if (cells.length === 2) {
          return {
            rule: cells[0].innerText,
            setting: cells[1].innerText,
          };
        } else if (cells.length === 3) {
          return {
            rule: cells[0].innerText,
            name: cells[1].innerText,
            setting: cells[2].innerText,
          };
        } else if (cells.length === 4) {
          return {
            position: cells[0].innerText,
            min: cells[1].innerText,
            max: cells[2].innerText,
            total: cells[3].innerText,
          };
        } else {
          // Handle other cases or return null
          return null;
        }
      }
    });

    return data;
  });

  console.log(leagueIDData);

  await page.waitForSelector(
    "#container > div:nth-child(7) > div:nth-child(2) > div > div.box-Rg.box-white > div.fantasyHeaderNav > ul > li:nth-child(2) > a"
  );
  await page.click(
    "#container > div:nth-child(7) > div:nth-child(2) > div > div.box-Rg.box-white > div.fantasyHeaderNav > ul > li:nth-child(2) > a"
  );
  await page.waitForSelector(
    "#container > div:nth-child(7) > div:nth-child(2) > div > div.box-Rg.box-white > table > tbody > tr:nth-child(3) > td:nth-child(1) > a"
  );

  const ownersData = await page.evaluate(() => {
    const ownerRows = Array.from(document.querySelectorAll("tr.row1")).concat(
      Array.from(document.querySelectorAll("tr.row2"))
    );

    const data = ownerRows.map((owner: any) => ({
      team: owner.querySelector("td:nth-child(1) > a").innerText.slice(1),
      manager: owner.querySelector("td:nth-child(2)").innerText,
      email: owner.querySelector("td:nth-child(4) > a").innerText,
    }));
    return data;
  });
  console.log(ownersData);
  fs.writeFileSync(
    "CBSLeagueRules.json",
    JSON.stringify([leagueIDData, ownersData])
  );

  await browser.close();
};

CBS_League_Settings();
