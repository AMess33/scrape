require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser, Frame } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const username = process.env.ESPNUSERNAME;
const password = process.env.ESPNPASSWORD;
// const ypassword = process.env.PASSWORDY;
// login page for cbs fantasy football w/ redirect to my teams webpage
// const url = "https://www.espn.com/login";
const url =
  "https://fantasy.espn.com/football/league/settings?leagueId=695637497&view=summary";

const ESPN_League_Settings = async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "load" });

  // login form is inside an IFrame
  let frame: Frame | null = null;

  for (const f of page.frames()) {
    const element = await f.frameElement();
    const id = await element?.evaluate((f) => f.id);
    if (id === "disneyid-iframe") {
      frame = f;
      break;
    }
  }
  console.log(frame);

  await frame?.waitForSelector(
    "#did-ui-view > div > section > section > form > section > div:nth-child(1) > div > label > span.input-wrapper > input"
  );
  // await frame?.click("text/Username or Email Address");
  await frame?.type(
    "#did-ui-view > div > section > section > form > section > div:nth-child(1) > div > label > span.input-wrapper > input",
    `${username}`
  );

  await frame?.type(
    "#did-ui-view > div > section > section > form > section > div:nth-child(2) > div > label > span.input-wrapper > input",
    `${password}`
  );
  // log in
  await frame?.click(
    "#did-ui-view > div > section > section > form > section > div.btn-group.touch-print-btn-group-wrapper > button"
  );
  // wait for redirect to espn.com
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.hover(
    "#global-nav > ul > li.pillar.logo.fantasy.fantasy > a > span > span.link-text"
  );
  // click on fantasy football page
  await page.click(
    "#submenu-pillarlogofantasyfantasy > ul:nth-child(1) > li:nth-child(8) > a"
  );

  // click on team based on league name
  await page.click(
    "#fantasy-feed-items > div.favItem.favItem--offseason > a.favItem__team > div > div.favItem__headline > div.favItem__subHead"
  );

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  // hover on 'league' drop down
  await page.waitForSelector("text/League");
  await page.hover("text/League");
  // click 'settings' in drop down menu
  await page.waitForSelector("text/Settings");
  await page.click("text/Settings");

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  // scrape ESPN league settings
  // navigate to basic settings
  await page.waitForSelector("text/Basic Settings");
  await page.click("text/Basic Settings");
  await page.waitForSelector("text/Format");
  //scrape basic settings table
  const basicSettings = await page.evaluate(() => {
    const rulesRows = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.basic--settings.isViewing > div > div > div.flex > div > div:nth-child(2) > table > tbody > tr"
      )
    );
    const data = rulesRows.map((rule: any) => ({
      rule: rule.querySelector("td:nth-child(1) > div > span").innerText,
      setting: rule.querySelector("td:nth-child(2) > div > span").innerText,
    }));
    return data;
  });
  console.log(basicSettings);
  // navigate to draft settings
  await page.waitForSelector(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div.page-container.cf > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(3) > span"
  );
  await page.click(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div.page-container.cf > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(3) > span"
  );
  await page.waitForSelector("text/Draft Type");
  // scrape draft table
  const draftSettings = await page.evaluate(() => {
    const rulesRows = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.draft--settings.isViewing > div > div > div.flex > div > div:nth-child(2) > table > tbody > tr"
      )
    );
    const data = rulesRows.map((rule: any) => ({
      rule: rule.querySelector("td:nth-child(1) > div > span").innerText,
      setting: rule.querySelector("td:nth-child(2) > div > span").innerText,
    }));
    return data;
  });
  console.log(draftSettings);

  // navigate to roster settings
  await page.waitForSelector(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(4) > span"
  );
  await page.click(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(4) > span"
  );
  await page.waitForSelector("text/Roster Size");
  // scrape rosters table
  const rosterSettings = await page.evaluate(() => {
    const rulesRows = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.roster--settings.isViewing > div > div.jsx-1268185935.layout_ab > div.jsx-699070603.league--settings--data--table.cols-2 > div > div.flex > div > div:nth-child(2) > table > tbody > tr"
      )
    );
    const data = rulesRows.map((rule: any) => ({
      rule: rule.querySelector("td:nth-child(1) > div > span").innerText,
      setting: rule.querySelector("td:nth-child(2) > div > span").innerText,
    }));
    return data;
  });
  console.log(rosterSettings);
  // scrape position table
  const positionSettings = await page.evaluate(() => {
    const rulesRows = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.roster--settings.isViewing > div > div.jsx-1268185935.layout_ab > div.jsx-1268185935.table_bottomMargin > div > div > div > div > div:nth-child(2) > table > tbody > tr"
      )
    );
    const data = rulesRows.map((rule: any) => ({
      position: rule.querySelector("td:nth-child(1) > div").innerText,
      starters: rule.querySelector("td:nth-child(2) > div > span").innerText,
      maximums: rule.querySelector("td:nth-child(3) > div > span").innerText,
    }));
    return data;
  });
  console.log(positionSettings);

  // navigate to scoring settings
  // await page.waitForSelector("text/Scoring");
  // await page.click("text/Scoring");
  // scrape scoring table
  // const scoringSettings = await page.evaluate(() => {
  //   const rulesRows = Array.from(
  //     document.querySelectorAll("table > tbody > tr")
  //   );
  //   const data = rulesRows.map((rule: any) => ({
  //     rule: rule.querySelector("td:nth-child(1) > div > span").innerText,
  //     setting: rule.querySelector("td:nth-child(2) > div > span").innerText,
  //   }));
  // });

  await page.waitForSelector(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(7) > span"
  );
  await page.click(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(7) > span"
  );
  await page.waitForSelector("text/Passing");
  // scrape keeper table
  const transactionSettings = await page.evaluate(() => {
    const tables = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.transactions--settings.isViewing > div"
      )
    );

    const tableData = tables.map((table: any) => {
      const rows = Array.from(table.querySelectorAll("tr"));

      const data = rows.map((row: any) => ({
        rule: row.querySelector("td:nth-child(1) > div > span").innerText,
        setting: row.querySelector("td:nth-child(2) > div > span").innerText,
      }));
      return data;
    });
    return tableData;
  });
  console.log(transactionSettings);

  await page.waitForSelector(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(8) > span"
  );
  await page.click(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(8) > span"
  );
  await page.waitForSelector("text/Start of Regular Season");
  // scrape schedule table
  const scheduleSettings = await page.evaluate(() => {
    const tables = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.schedule--settings.isViewing > div"
      )
    );
    const tableData = tables.map((table: any) => {
      const rows = Array.from(table.querySelectorAll("tr"));

      const data = rows.map((row: any) => ({
        rule: row.querySelector("td:nth-child(1) > div > span").innerText,
        setting: row.querySelector("td:nth-child(2) > div").innerText,
      }));
      return data;
    });
    return tableData;
  });
  console.log(scheduleSettings);

  // navigate to 'members' page
  await page.waitForSelector("text/League");
  await page.hover("text/League");
  // select 'members' from league drop down menu
  await page.waitForSelector("text/Members");
  await page.click("text/Members");

  // scrape managers page

  await page.waitForSelector(
    "table > tbody > tr:nth-child(1) > td:nth-child(3) > div > span"
  );

  const ownerData = await page.evaluate(() => {
    const ownerRows = Array.from(
      document.querySelectorAll("table > tbody > tr")
    );

    const data = ownerRows.map((owner: any) => ({
      team: owner.querySelector("td:nth-child(3) > div > span").innerText,
      division: owner.querySelector("td:nth-child(4) > div").innerText,
      manager: owner.querySelector("td:nth-child(5) > div").innerText,
    }));
    return data;
  });
  console.log(ownerData);

  // await browser.close();
};

ESPN_League_Settings();
