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
const url =
  "https://login.yahoo.com/?.lang=en-US&src=sports&activity=ybar-signin&pspid=782201015&done=https%3A%2F%2Ffootball.fantasysports.yahoo.com%2F&add=1";

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
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // enter login credentials and click login
  await page.type("#login-username", "dmesser_19");
  await page.click("#login-signin");
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.type("#login-passwd", `${ypassword}`);
  await page.click("#login-signin");
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.click(
    "#tsv-authenticator-challenge-trustedFor2SV > form > div.txt-align-center.margin24 > button"
  );
  // 2FA required on yahoo

  // wait for navigation to my teams page

  // click on intended team using text selector and team name

  // click on league
  // click on

  // await browser.close();
};

Yahoo_League_Settings();
