const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://fantasy.nfl.com/draftcenter/breakdown";

(async () => {
  const browser: Browser = await puppeteer.launch({
    // headless: false,
    // devtools: true,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url);

  let players = new Array();
  let firstPlayer = "";

  while (players.length < 500) {
    await page.waitForSelector(
      "table > tbody > tr > td:nth-child(1) > div > a"
    );

    // console.log({ firstPlayer });

    await page.waitForFunction(
      (p) => {
        const player = document.querySelector<HTMLAnchorElement>(
          "table > tbody > tr > td:nth-child(1) > div > a"
        )?.innerText;
        if (!p || player !== p) {
          console.log("*** NEW PAGE, SETTING PLAYER ***");
          return true;
        }
        return false;
      },
      { polling: 5000, timeout: 30000 },
      firstPlayer
    );

    const first = await page.evaluate(() => {
      return document.querySelector<HTMLElement>(
        "table > tbody > tr > td:nth-child(1) > div > a"
      )?.innerText;
    });
    firstPlayer = first ?? "";
    // console.log("*** GETTING PLAYER ROWS ***");

    const playerRows = await page.$$("table > tbody > tr");
    for (const playerData of playerRows) {
      let adp: any = "Null";
      let playerName: any = "Null";
      let position: any = "Null";
      let team: any = "Null";
      let round: any = "Null";
      let salary: any = "Null";

      try {
        adp = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(2)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        playerName = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(1) > div > a").innerText,
          playerData
        );
      } catch (error) {}

      try {
        position = await page.evaluate(
          (el: any) =>
            el
              .querySelector("td:nth-child(1) > div > em")
              .innerText.slice(0, 2)
              .trim(),
          playerData
        );
      } catch (error) {}

      try {
        team = await page.evaluate(
          (el: any) =>
            el
              .querySelector("td:nth-child(1) > div > em")
              .innerText.slice(-3)
              .trim(),
          playerData
        );
      } catch (error) {}

      try {
        round = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(3)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        salary = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(4)").innerText,
          playerData
        );
      } catch (error) {}

      if (adp !== "Null") {
        players.push({ adp, playerName, position, team, round, salary });
      }
    }

    await page.waitForSelector(
      "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[1]/div[2]/div/ul/li[11]/a"
    );
    await page.click(
      "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[1]/div[2]/div/ul/li[11]/a"
    );
  }

  fs.writeFileSync("NFLADP.json", JSON.stringify(players));
  // console.log("*** DONE ***");
  await browser.close();
})();
