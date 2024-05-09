require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
// use your username and password from dotenv
const username = process.env.UDUSERNAME;
const password = process.env.UDPASSWORD;

const url = "https://underdogfantasy.com/login?next=%2Frankings%2Fnfl";

const Underdog_ADP = async () => {
  const browser = await puppeteer.launch({
    // headless: false,
    executablePath: executablePath(),
    // devtools: true,
  });

  const page = await browser.newPage();

  // page.on("console", (msg: any) => console.log("PAGE LOG:", msg.text()));

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(
    "https://underdogfantasy.com/login?next=%2Frankings%2Fnfl",
    ["geolocation"]
  );
  // listen for dialog box that requests location verification
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  // set geolocation to location where site is accessable
  await page.setGeolocation({ latitude: 39, longitude: -94 });
  // sign in path
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
  // after sign in redirected to adp page, wait for document to load
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(
    "xpath/html/body/div[1]/div/div/div[2]/div[1]/div[2]/div[2]/div[1]/div/div/div[1]"
  );
  // scrape table for rendered rows
  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll(
        "#root > div > div > div.styles__rankingSection__jCB_w > div.styles__playerListColumn__va0Um > div.styles__playerListWrapper__mF2u0 > div.styles__autoSizer__puLtf > div:nth-child(1) > div > div > div"
      )
    );
    let players: any[] = [];

    // grab the initial rendered rows on the page and adds them to the player array and then exports to adpData
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

    return players;
  });

  function waitFor(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // push scrolled data into the adpData array
  await page.exposeFunction("addPlayers", (data: any) => {
    adpData.push(data);
  });
  // watch DOM for mutations and capture newly rendered rows
  await page.evaluate(async () => {
    const observer = new MutationObserver(async (mutationsList: any) => {
      for (let mutation of mutationsList) {
        if (mutation.addedNodes.length) {
          for (let node of mutation.addedNodes) {
            const player = {
              playerName: node.querySelector(
                "div > div > div.styles__playerInfo__CyzKu > div.styles__playerName__tC8I7"
              ).innerText,
              position: node.querySelector(
                "div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > div"
              ).innerText,
              team: node.querySelector(
                "div > div.styles__playerInfo__CyzKu > div.styles__playerPosition__ziprS > p > strong"
              ).innerText,
              adp: node.querySelector(
                "div > div.styles__rightSide__uDVQf > div:nth-child(1) > p.styles__statValue__g8zd5"
              ).innerText,
            };

            // @ts-expect-error
            await window.addPlayers(player);
          }
        }
      }
    });

    const virtualListNode = document.querySelector(".ReactVirtualized__List");

    observer.observe(virtualListNode, { childList: true, subtree: true });
  });

  // scroll function, scrolls to bottom of table or until adpData.legth reaches your desired size
  async function scrollToBottom(page: any) {
    let retryScrollCount = 3;
    // change adpData.length to determine how many rows of the adp tabel you want returned, table is over 900 rows in total
    while (retryScrollCount > 0 && adpData.length < 300) {
      try {
        let scrollPosition = await page.$eval(
          ".ReactVirtualized__List",
          (wrapper: any) => wrapper.scrollTop
        );

        await page.evaluate(() =>
          document
            .querySelector(".ReactVirtualized__List")
            .scrollBy({ top: 200, behavior: "smooth" })
        );

        await waitFor(200);

        await page.waitForFunction(
          `document.querySelector('.ReactVirtualized__List').scrollTop > ${scrollPosition}`,
          { timeout: 1000 }
        );
        // scroll counter will reach 0 when you have reached the bottom of the table
        retryScrollCount = 3;
      } catch {
        retryScrollCount--;
      }
    }
  }

  await scrollToBottom(page);
  await browser.close();

  fs.writeFileSync(
    `UnderDogADP${currentDate}.json`,
    JSON.stringify({ adpData })
  );
};

Underdog_ADP();
