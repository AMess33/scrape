const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://underdogfantasy.com/rankings/nfl";
// will need to send headers to avoid sign in

// scrape for adp data
const Underdog_ADP = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });
  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll(
        "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div:nth-child(1)"
      )
    );
    // map each row in the table
    const data = playerRows.map((player: any) => ({
      playerName: player.querySelector(
        "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div:nth-child(1) > div > div > div.styles__playerInfo__CyzKu > div.styles__playerName__tC8I7"
      ).innerText,
      position: player.querySelector(
        "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div:nth-child(1) > div > div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > div"
      ).innerText,
      team: player.querySelector(
        "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div:nth-child(1) > div > div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > p > strong"
      ).innerText,
      adp: player.querySelector(
        "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div:nth-child(1) > div > div > div.styles__rightSide__uDVQf > div:nth-child(1) > p.styles__statValue__g8zd5"
      ).innerText,
    }));
    return data;
  });
  console.log(adpData);
};

Underdog_ADP();
