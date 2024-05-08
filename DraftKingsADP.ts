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

  page.on("console", (msg: any) => console.log("PAGE LOG:", msg.text()));

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
  await page.waitForSelector(
    "xpath/html/body/div[1]/div/div/div[2]/div[1]/div[2]/div[2]/div[1]/div/div/div[1]"
  );
  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(document.querySelectorAll("div.row"));
    let players: any[] = [];

    // map each row in the table
    playerRows.forEach((player: any) => {
      players.push({
        rank: player.querySelector("div:nth-child(2)").innerText,
        playerName: player.querySelector("div.PlayerCell_player-name")
          .innerText,
        position: player.querySelector("div.player-position").innerText,
        team: player.querySelector("div.player-team > div").innerText,
        adp: player.querySelector("div:nth-child(6) > div > span > span")
          .innerText,
      });
    });

    return players;
  });

  function waitFor(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await page.exposeFunction("addPlayers", (data: any) => {
    console.log(data.playerName);
    adpData.push(data);
  });

  await page.evaluate(async () => {
    console.log("*** SETTING UP MUTATION OBSERVER ***");

    const observer = new MutationObserver(async (mutationsList: any) => {
      for (let mutation of mutationsList) {
        if (mutation.addedNodes.length) {
          for (let node of mutation.addedNodes) {
            const player = {
              rank: node.querySelector("div:nth-child(2)").innerText,
              playerName: node.querySelector("div.PlayerCell_player-name")
                .innerText,
              position: node.querySelector("div.player-position").innerText,
              team: node.querySelector("div.player-team > div").innerText,
              adp: node.querySelector("div:nth-child(6) > div > span > span")
                .innerText,
            };

            // @ts-expect-error
            await window.addPlayers(player);
          }
        }
      }
    });

    const virtualListNode = document.querySelector(".DKResponsiveGrid_dk-grid");

    observer.observe(virtualListNode, { childList: true, subtree: true });
  });

  async function scrollToBottom(page: any) {
    console.log("*** SCROLLING TO BOTTOM ***");

    let retryScrollCount = 3;
    // change adpData.length to determine how many rows of the adp tabel you want returned, table is over 900 rows in total
    while (retryScrollCount > 0 && adpData.length < 300) {
      try {
        let scrollPosition = await page.$eval(
          ".DKResponsiveGrid_dk-grid",
          (wrapper: any) => wrapper.scrollTop
        );

        await page.evaluate(() =>
          document
            .querySelector(".DKResponsiveGrid_dk-grid")
            .scrollBy({ top: 200, behavior: "smooth" })
        );

        await waitFor(200);

        await page.waitForFunction(
          `document.querySelector('.DKResponsiveGrid_dk-grid').scrollTop > ${scrollPosition}`,
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

  console.dir({ adpData }, { depth: null });

  fs.writeFileSync(
    `DraftKingsADP${currentDate}.json`,
    JSON.stringify({ adpData })
  );
};

DraftKings_ADP();
