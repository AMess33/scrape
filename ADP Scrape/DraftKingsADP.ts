require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const username = process.env.DKUSERNAME;
const password = process.env.DKPASSWORD;

const url =
  "https://myaccount.draftkings.com/login?returnPath=%2Fdraft%2Frankings%2Fnfl%2F";

const DraftKings_ADP = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
    devtools: true,
  });

  const page = await browser.newPage();

  // page.on("console", (msg: any) => console.log("PAGE LOG:", msg.text()));

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(
    "https://myaccount.draftkings.com/login?returnPath=%2Fdraft%2Frankings%2Fnfl%2F",
    ["geolocation"]
  );
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.setGeolocation({ latitude: 39, longitude: -94 });

  await page.goto(url, {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector("#login-username-input");
  await page.type("#login-username-input", `${username}`);
  await page.type("#login-password-input", `${password}`);
  await page.click("#login-submit");

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("div.PlayerCell_player-name");
  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll("div.BaseTable__row")
    );
    let players: any[] = [];

    // map each row in the table
    playerRows.forEach((player: any) => {
      players.push({
        rank: player.querySelector("div:nth-child(2) > div > span").innerText,
        playerName: player.querySelector(
          "div:nth-child(3) > div > div.PlayerCell_player-details-container > div.PlayerCell_player-name-container > div.PlayerCell_player-name"
        ).innerText,
        position: player.querySelector(
          "div:nth-child(3) > div > div.PlayerCell_player-details-container > div.PlayerCell_player-position-and-team > div.player-position"
        ).innerText,
        team: player.querySelector(
          "div:nth-child(3) > div > div.PlayerCell_player-details-container > div.PlayerCell_player-position-and-team > div.PlayerCell_player-team > div"
        ).innerText,
        adp: player.querySelector("div:nth-child(5) > div > span").innerText,
      });
    });

    return players;
  });

  function waitFor(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await page.exposeFunction("addPlayers", (data: any) => {
    adpData.push(data);
  });

  await page.evaluate(async () => {
    console.log("*** SETTING UP MUTATION OBSERVER ***");

    const observer = new MutationObserver(async (mutationsList: any) => {
      for (let mutation of mutationsList) {
        if (mutation.addedNodes.length) {
          for (let node of mutation.addedNodes) {
            const player = {
              rank: node.querySelector("div:nth-child(2) > div > span")
                .innerText,
              playerName: node.querySelector(
                "div:nth-child(3) > div > div.PlayerCell_player-details-container > div.PlayerCell_player-name-container > div.PlayerCell_player-name"
              ).innerText,
              position: node.querySelector(
                "div:nth-child(3) > div > div.PlayerCell_player-details-container > div.PlayerCell_player-position-and-team > div.player-position"
              ).innerText,
              team: node.querySelector(
                "div:nth-child(3) > div > div.PlayerCell_player-details-container > div.PlayerCell_player-position-and-team > div.PlayerCell_player-team > div"
              ).innerText,
              adp: node.querySelector("div:nth-child(5) > div > span")
                .innerText,
            };

            // @ts-expect-error
            await window.addPlayers(player);
          }
        }
      }
    });

    const virtualListNode = document.querySelector(".BaseTable__body");

    observer.observe(virtualListNode, { childList: true, subtree: true });
  });

  async function scrollToBottom(page: any) {
    console.log("*** SCROLLING TO BOTTOM ***");

    let retryScrollCount = 3;
    // change adpData.length to determine how many rows of the adp tabel you want returned, table is over 900 rows in total
    while (retryScrollCount > 0 && adpData.length < 300) {
      try {
        let scrollPosition = await page.$eval(
          ".BaseTable__body",
          (wrapper: any) => wrapper.scrollTop
        );

        await page.evaluate(() =>
          document
            .querySelector(".BaseTable__body")
            .scrollBy({ top: 200, behavior: "smooth" })
        );

        await waitFor(200);

        await page.waitForFunction(
          `document.querySelector('.BaseTable__body').scrollTop > ${scrollPosition}`,
          { timeout: 1000 }
        );

        retryScrollCount = 3;
      } catch {
        retryScrollCount--;
      }
    }
  }

  await scrollToBottom(page);
  await browser.close();

  fs.writeFileSync(
    `DraftKingsADP${currentDate}.json`,
    JSON.stringify({ adpData })
  );
};

DraftKings_ADP();
