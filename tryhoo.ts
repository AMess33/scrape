const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url =
  "https://football.fantasysports.yahoo.com/f1/draftanalysis?type=standard";

(async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url);

  let isBtnDisabled = false;
  let players = new Array();

  while (!isBtnDisabled) {
    await page.waitForSelector("td:nth-child(2) > div", { timeout: 10000 });

    const playerRows = await page.$$("table > tbody > tr");
    for (const playerData of playerRows) {
      let rank: any = "Null";
      let playerName: any = "Null";
      let position: any = "Null";
      let team: any = "Null";
      let adp: any = "Null";
      let lastSevenDaysADP: any = "Null";

      try {
        rank = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(2) > div").innerText,
          playerData
        );
      } catch (error) {}

      try {
        playerName = await page.evaluate(
          (el: any) =>
            el.querySelector("td:nth-child(1) > div > div > div > div")
              .innerText,
          playerData
        );
      } catch (error) {}

      try {
        position = await page.evaluate(
          (el: any) =>
            el.querySelector("td:nth-child(1) > div > div > div > div > span")
              .innerText,
          playerData
        );
      } catch (error) {}

      try {
        team = await page.evaluate(
          (el: any) =>
            el
              .querySelector(
                "td:nth-child(1) > div > div > div > div:nth-child(2)"
              )
              .innerText.slice(0, -5),
          playerData
        );
      } catch (error) {}

      try {
        adp = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(7) > div").innerText,
          playerData
        );
      } catch (error) {}

      try {
        lastSevenDaysADP = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(8) > div").innerText,
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
          lastSevenDaysADP,
        });
      }
    }

    await page.waitForSelector(
      "xpath/html/body/div[1]/div[2]/div[2]/div[2]/div/div/div[2]/div[2]/section/div/div/div[2]/section/div[2]/div/div[2]/div/button[2]",
      {
        visible: true,
      }
    );

    const btn = await page.$(
      "xpath/html/body/div[1]/div[2]/div[2]/div[2]/div/div/div[2]/div[2]/section/div/div/div[2]/section/div[2]/div/div[2]/div/button[2]"
    );

    const is_disabled = await btn?.evaluate((b) => {
      const button = b as HTMLButtonElement;
      return button.disabled;
    });

    isBtnDisabled = !!is_disabled;
    if (!is_disabled) {
      await Promise.all([
        page.click(
          "xpath/html/body/div[1]/div[2]/div[2]/div[2]/div/div/div[2]/div[2]/section/div/div/div[2]/section/div[2]/div/div[2]/div/button[2]"
        ),
      ]);
    }
  }
  fs.writeFileSync(
    `${currentDate} yahooADP.json`,
    JSON.stringify({
      players,
    }),
    (err: any) => {
      if (err) throw err;
    }
  );

  await browser.close();
})();
