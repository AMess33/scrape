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

  await frame?.click(
    "#did-ui-view > div > section > section > form > section > div.btn-group.touch-print-btn-group-wrapper > button"
  );

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.hover(
    "#global-nav > ul > li.pillar.logo.fantasy.fantasy > a > span > span.link-text"
  );
  await page.click(
    "#submenu-pillarlogofantasyfantasy > ul:nth-child(1) > li:nth-child(8) > a"
  );
  // click on user icon
  // await page.waitForSelector("#global-user-trigger");
  // await page.hover("#global-user-trigger");

  // await page.waitForSelector(
  //   "xpath/html/body/div[5]/div[2]/header/div[2]/ul/li[2]/div/div/ul[1]/li[8]/a"
  // );
  // await page.click(
  //   "xpath/html/body/div[5]/div[2]/header/div[2]/ul/li[2]/div/div/ul[1]/li[8]/a"
  // );
  // wait for login modal, click on sign in with username
  // await page.waitForSelector("#LaunchLogin > a");
  // await page.click("#LaunchLogin > a");
  // click on login (not working)
  // await page.click(
  //   "#global-viewport > div.global-user > div > ul.account-management > li:nth-child(8)"
  // );

  // wait for navigation to my teams page

  // click on intended team using text selector and team name

  // click on league
  // click on

  // await browser.close();
};

ESPN_League_Settings();
