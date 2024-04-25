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
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // click on user icon
  await page.type(
    "##did-ui-view > div > section > section > form > section > div:nth-child(2) > div > label > span.input-wrapper > input",
    "mess33_09"
  );
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
