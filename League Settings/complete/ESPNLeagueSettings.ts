require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser, Frame } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const username = process.env.ESPNUSERNAME;
const password = process.env.ESPNPASSWORD;

const leagueName = "Draft Hero Test League";
// login page
const url = "https://www.espn.com/login";

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
  await page.waitForSelector(
    "#global-nav > ul > li.pillar.logo.fantasy.fantasy > a > span > span.link-text"
  );
  // hover to show fantasy drop down
  await page.hover(
    "#global-nav > ul > li.pillar.logo.fantasy.fantasy > a > span > span.link-text"
  );
  // click on fantasy football page
  await page.click(
    "#submenu-pillarlogofantasyfantasy > ul:nth-child(1) > li:nth-child(8) > a"
  );

  // wait for selector to load
  await page.waitForSelector(`text/${leagueName}`);
  // click on team based on users league name
  await page.click(`text/${leagueName}`);

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  // hover on 'league' drop down
  await page.waitForSelector("text/League");
  await page.hover("text/League");
  // click 'settings' in drop down menu
  await page.waitForSelector("text/Settings");
  await page.click("text/Settings");

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  // // navigate to basic settings
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
    const data = rulesRows.flatMap((rule: any) => ({
      rule: rule.querySelector("td:nth-child(1) > div > span").innerText,
      setting: rule.querySelector("td:nth-child(2) > div > span").innerText,
    }));
    return data;
  });

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

  // navigate to scoring settings
  await page.waitForSelector(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(5) > span"
  );
  await page.click(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(5) > span"
  );
  await page.waitForSelector("text/Passing Yards (PY)");
  // scrape scoring tables
  interface RowData {
    rule: string | null;
    setting: string | null;
  }
  const scoringSettings = await page.evaluate(() => {
    const tables = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.scoring--settings.multipleCategories.isViewing > div > div "
      )
    );
    const tableData = tables.flatMap((table: any) => {
      const rows = Array.from(table.querySelectorAll("tr"));

      const data: RowData[] = rows.map((row: any) => {
        const ruleElement = row.querySelector(
          "td:nth-child(1) > div > div > div:nth-child(1)"
        );
        const settingElement = row.querySelector(
          "td:nth-child(1) > div > div > div:nth-child(2)"
        );
        const rowData: RowData = { rule: null, setting: null };

        if (ruleElement && ruleElement.innerText !== "") {
          rowData.rule = ruleElement.innerText;
        } else {
          rowData.rule = null;
        }

        // Check if settingElement exists and its innerText is not empty
        // these tables have a lot of empty rows for no real reason
        if (settingElement && settingElement.innerText !== "") {
          rowData.setting = settingElement.innerText;
        } else {
          rowData.setting = null;
        }

        return rowData;
      });

      return data;
    });
    return tableData;
  });

  // navigate to transaction settings
  await page.waitForSelector(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(7) > span"
  );
  await page.click(
    "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-559466336.AnchorList > ul > li:nth-child(7) > span"
  );
  await page.waitForSelector("text/Passing");
  // scrape transactions tables
  const transactionSettings = await page.evaluate(() => {
    const tables = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div:nth-child(4) > div.league--settings--table.transactions--settings.isViewing > div"
      )
    );

    const tableData = tables.flatMap((table: any) => {
      const rows = Array.from(table.querySelectorAll("tr"));

      const data = rows.map((row: any) => ({
        rule: row.querySelector("td:nth-child(1) > div > span").innerText,
        setting: row.querySelector("td:nth-child(2) > div > span").innerText,
      }));
      return data;
    });
    return tableData;
  });
  // navigate to schedule settings
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
    const tableData = tables.flatMap((table: any) => {
      const rows = Array.from(table.querySelectorAll("tr"));

      const data = rows.map((row: any) => ({
        rule: row.querySelector("td:nth-child(1) > div > span").innerText,
        setting: row.querySelector("td:nth-child(2) > div").innerText,
      }));
      return data;
    });
    return tableData;
  });

  // navigate to 'members' page
  await page.waitForSelector(
    "#fitt-analytics > div > div.navigation__container.sticky.top-0.Site__Header > nav > ul > li.league.active.NavSecondary__Item > a > span > span"
  );
  await page.hover(
    "#fitt-analytics > div > div.navigation__container.sticky.top-0.Site__Header > nav > ul > li.league.active.NavSecondary__Item > a > span > span"
  );
  // select 'members' from league drop down menu
  await page.waitForSelector(
    "#fitt-analytics > div > div.navigation__container.sticky.top-0.Site__Header > nav > ul > li.league.active.NavSecondary__Item > div > div > div > ul:nth-child(1) > li:nth-child(3) > a > span > span"
  );
  await page.click(
    "#fitt-analytics > div > div.navigation__container.sticky.top-0.Site__Header > nav > ul > li.league.active.NavSecondary__Item > div > div > div > ul:nth-child(1) > li:nth-child(3) > a > span > span"
  );

  // scrape managers page

  await page.waitForSelector("text/TEAM NAME");

  const ownerData = await page.evaluate(() => {
    const ownerRows = Array.from(
      document.querySelectorAll(
        "#fitt-analytics > div > div.jsx-3010562182.shell-container > div > div.layout.is-full > div > div > div.jsx-641403846.members-container > div.jsx-2893748710.leagueMembersTable.pa3 > div > div > div > div:nth-child(2) > table > tbody > tr"
      )
    );

    const data = ownerRows.map((owner: any) => ({
      team: owner.querySelector("td:nth-child(3) > div > div > div > a > span")
        .innerText,
      manager: owner.querySelector("td:nth-child(4) > div > div").innerText,
    }));
    return data;
  });
  // create json file with all scraped data filter out null rule values to remove empty table row data
  fs.writeFileSync(
    "ESPNLeagueSettings.json",
    JSON.stringify({
      ownerData,
      basicSettings: basicSettings.filter((rule) => rule.rule !== null),
      draftSettings: draftSettings.filter((rule) => rule.rule !== null),
      rosterSettings: rosterSettings.filter((rule) => rule.rule !== null),
      positionSettings,
      scoringSettings: scoringSettings.filter((rule) => rule.rule !== null),
      scheduleSettings: scheduleSettings.filter((rule) => rule.rule !== null),
      transactionSettings: transactionSettings.filter(
        (rule) => rule.rule !== null
      ),
    }),
    (err): any => {
      if (err) throw err;
    }
  );
  await browser.close();
};

ESPN_League_Settings();
