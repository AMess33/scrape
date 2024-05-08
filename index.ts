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

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let players: any[] = [];
async function scrollToBottom(page) {
  let retryScrollCount = 3;

  while (retryScrollCount > 0 || players.length < 100) {
    try {
      let scrollPosition = await page.$eval(
        ".ReactVirtualized__List",
        (wrapper) => wrapper.scrollTop
      );

      await page.evaluate(() =>
        document
          .querySelector(".ReactVirtualized__List")
          .scrollBy({ top: 200, behavior: "smooth" })
      );
      await waitFor(200);

      await page.waitForFunction(
        `document.querySelector('.ReactVirtualized__List').scrollTop > ${scrollPosition}`,
        { timeout: 1_000 }
      );

      retryScrollCount = 3;
    } catch {
      retryScrollCount--;
    }
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    devtools: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--lang=en-US,en;q=0.9",
    ],
  });
  const page = await browser.newPage();
  page.on("console", (msg: any) => console.log("PAGE LOG:", msg.text()));
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(
    "https://underdogfantasy.com/login?next=%2Frankings%2Fnfl",
    ["geolocation"]
  );
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.setGeolocation({ latitude: 39, longitude: -94 });
  await page.goto(url, { waitUntil: "networkidle0" });
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
  await page.exposeFunction("playerData", (playerData) => {
    players.push(playerData);
    console.log(playerData);
  });
  await page.evaluate(() => {
    const observer = new MutationObserver(async (mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.addedNodes.length) {
          for (let node of mutation.addedNodes) {
            let playerName = node.querySelector(
              "div > div > div.styles__playerInfo__CyzKu > div.styles__playerName__tC8I7"
            ).textContent;
            let position = node.querySelector(
              "div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > div"
            ).textContent;
            let team = node.querySelector(
              "div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > p > strong"
            ).textContent;
            let adp = node.querySelector(
              "div > div.styles__rightSide__uDVQf > div:nth-child(1) > p.styles__statValue__g8zd5"
            );
            console.log(playerName);
            await window.playerData({ playerName, position, team, adp });
          }
        }
      }
    });
    const virtualListNode = document.querySelector(".ReactVirtualized__List");
    observer.observe(virtualListNode, { childList: true, subtree: true });
  });
  await scrollToBottom(page);
  fs.writeFileSync("players.json", JSON.stringify({ players }));
  await browser.close();
}

run();
