require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const username = process.env.UDUSERNAME;
const password = process.env.UDPASSWORD;

const url = "https://underdogfantasy.com/login?next=%2Frankings%2Fnfl";
// will need to send headers to avoid sign in
// scroll and scrape function
// while array.length < 250 scrape, scroll x pixels
// scrape for adp data
const Underdog_ADP = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(
    "https://underdogfantasy.com/login?next=%2Frankings%2Fnfl",
    ["geolocation"]
  );
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.setGeolocation({ latitude: 39, longitude: -94 });

  await page.goto(url, {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector(
    "#root > div > div > div.styles__content__UZPqb > div.styles__splashContent__ncVyR > div.styles__formContent__PdEcR > form > div:nth-child(1) > label > div.styles__field__Q6LKF > input"
  );
  await page.type(
    "#root > div > div > div.styles__content__UZPqb > div.styles__splashContent__ncVyR > div.styles__formContent__PdEcR > form > div:nth-child(1) > label > div.styles__field__Q6LKF > input",
    `${username}`
  );
  await page.type(
    "#root > div > div > div.styles__content__UZPqb > div.styles__splashContent__ncVyR > div.styles__formContent__PdEcR > form > div:nth-child(2) > label > div.styles__field__Q6LKF > input",
    `${password}`
  );
  await page.click(
    "#root > div > div > div.styles__content__UZPqb > div.styles__splashContent__ncVyR > div.styles__formContent__PdEcR > form > button"
  );

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(
    "xpath/html/body/div[1]/div/div/div[2]/div[1]/div[2]/div[2]/div[1]/div/div/div[1]"
  );

  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll(
        "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div"
      )
    );
    let players: any[] = [];
    while (players.length < 250) {
      // map each row in the table
      playerRows.forEach((player: any) => {
        players.push({
          playerName: player.querySelector(
            "div > div > div > div.styles__playerInfo__CyzKu > div.styles__playerName__tC8I7"
          ).innerText,
          position: player.querySelector(
            "div > div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > div"
          ).innerText,
          team: player.querySelector(
            "div > div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > p > strong"
          ).innerText,
          adp: player.querySelector(
            "div > div > div.styles__rightSide__uDVQf > div:nth-child(1) > p.styles__statValue__g8zd5"
          ).innerText,
        });
      });
    }
    return players;
  });

  await page.hover(
    "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div:nth-child(1) > div > div"
  );
  await page.mouse.wheel({ deltaY: 528 });
  await page.waitForSelector(
    "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div:nth-child(11)"
  );

  fs.writeFile("adp.json", JSON.stringify({ adpData }), (err) => {});
};

Underdog_ADP();
