const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://fantasy.espn.com/football/livedraftresults";

(async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url);

  let players = new Array();
  let isBtnDisabled = false;
  let firstPlayer = "";

  await page.waitForSelector("tbody > tr");

  while (!isBtnDisabled) {
    console.log("*** RUNNING SCRAPE ***");
    console.log({ firstPlayer });

    await page.waitForFunction(
      (p) => {
        const player = document.querySelector<HTMLDivElement>(
          "tbody > tr > td:nth-child(2) > div"
        )?.title;

        if (!p || player !== p) {
          console.log("*** NEW PAGE, SETTING PLAYER ***");
          return true;
        }

        console.log("*** RETURNING FALSE ***");
        return false;
      },
      { polling: 5000, timeout: 60000 },
      firstPlayer
    );

    const first = await page.evaluate(() => {
      return document.querySelector<HTMLElement>(
        "tbody > tr > td:nth-child(2) > div"
      )?.title;
    });

    firstPlayer = first ?? "";

    console.log("*** GETTING PLAYER ROWS ***");

    const playerRows = await page.$$(".Table__TBODY > tr");

    for (const playerData of playerRows) {
      let rank: any = "Null";
      let playerName: any = "Null";
      let position: any = "Null";
      let team: any = "Null";
      let adp: any = "Null";
      let changeADP: any = "Null";
      let auctionValue: any = "Null";
      let auctionChange: any = "Null";

      try {
        rank = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(1) > div").innerText,
          playerData
        );
      } catch (error) {}

      try {
        playerName = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__athlete.flex > span > a"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        position = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__position.flex > span.playerinfo__playerpos.ttu"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        team = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "td:nth-child(2) > div > div > div.jsx-1811044066.player-column_info.flex.flex-column > div > div.jsx-1811044066.player-column__position.flex > span.playerinfo__playerteam"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        adp = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(3) > div").innerText,
          playerData
        );
      } catch (error) {}

      try {
        changeADP = await page.evaluate(
          (el: any) =>
            el.querySelector("td:nth-child(4) > div > span").innerText,
          playerData
        );
      } catch (error) {}

      try {
        auctionValue = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(5) > div").innerText,
          playerData
        );
      } catch (error) {}

      try {
        auctionChange = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(6) > div").innerText,
          playerData
        );
      } catch (error) {}

      if (rank !== "Null") {
        players.push({
          rank,
          playerName,
          position,
          team,
          adp,
          changeADP,
          auctionValue,
          auctionChange,
        });
      }
    }

    console.log("*** FINDING NEXT BTN ***");

    await page.waitForSelector(".Pagination__Button--next", {
      visible: true,
    });

    const is_disabled =
      (await page.$(".Pagination__Button--next.Button--disabled")) !== null;

    isBtnDisabled = is_disabled;
    console.log("*** DISABLED:", is_disabled, "***");

    if (!is_disabled) {
      console.log("*** CLICKING NEXT ***");
      await page.click(".Pagination__Button--next");
    }
  }

  fs.writeFile(
    "espnADP.json",
    JSON.stringify({
      players,
    }),
    (err) => {
      if (err) throw err;
    }
  );

  await browser.close();
})();
