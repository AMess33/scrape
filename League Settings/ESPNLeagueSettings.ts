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

  // login form is inside an IFrame
  const frame = page
    .frames()
    .find((frame) => frame.name() === "#disneyid-iframe");
  const text = await frame.$eval(
    "#disneyid-iframe",
    (element) => element.textContent
  );
  console.log(text);

  await page.waitForSelector(
    "#did-ui-view > div > section > section > form > section > div:nth-child(1) > div > label > span.input-wrapper > input"
  );
  // await page.click("text/Username or Email Address");
  await page.type(
    "#did-ui-view > div > section > section > form > section > div:nth-child(1) > div > label > span.input-wrapper > input",
    `${username}`
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
