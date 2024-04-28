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
const leagueID = "11864040";
// login page for cbs fantasy football w/ redirect to my teams webpage
const url = `https://fantasy.nfl.com/league/${leagueID}/settings`;

const NFL_League_Settings = async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
  );

  // if user knows league id, go directly to league settings page/ if not, set up log in routes to league settings page
  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForSelector("#yui_3_15_0_1_1714333617183_223");

  // await browser.close();
};

NFL_League_Settings();
