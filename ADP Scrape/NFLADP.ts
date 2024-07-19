const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://fantasy.nfl.com/draftcenter/breakdown";

(async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url);

  let players = new Array();
  let isBtnDisabled = false;
  let firstPlayer = "";

  await page.waitForSelector(
    "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]"
  );

  while (!isBtnDisabled) {
    console.log("*** RUNNING SCRAPE ***");
    console.log({ firstPlayer });
    // wait for next button
    await page.waitForFunction(
      (p) => {
        const player = document.querySelector<HTMLDivElement>(
          "table > tbody > tr > td:nth-child(1) > div > a"
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
        "table > tbody > tr > td:nth-child(1) > div > a"
      )?.title;
    });
    firstPlayer = first ?? "";

    console.log("*** GETTING PLAYER ROWS ***");

    const playerRows = await page.$$(
      "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]"
    );

    for (const playerData of playerRows) {
      let adp: any = "Null";
      let playerName: any = "Null";
      let position: any = "Null";
      let team: any = "Null";
      let round: any = "Null";
      let salary: any = "Null";

      try {
        adp = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]/td[2]"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        playerName = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]/td[1]/div/a"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        position = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]/td[1]/div/em"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        team = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]/td[1]/div/em"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        round = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]/td[3]"
            ).innerText,
          playerData
        );
      } catch (error) {}

      try {
        salary = await page.evaluate(
          (el: any) =>
            el.querySelector(
              "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/table/tbody/tr[1]/td[4]"
            ).innerText,
          playerData
        );
      } catch (error) {}

      if (adp !== "Null") {
        players.push({ adp, playerName, position, team, round, salary });
      }
    }

    console.log("*** FINDING NEXT BTN ***");

    await page.waitForSelector(
      "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[1]/div[2]/div/ul/li[11]/a",
      {
        visible: true,
      }
    );

    const element = await page.$(
      "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[1]/div[2]/div/ul/li[11]/*"
    );

    let is_disabled = false;
    if (element) {
      const tagName = await page.evaluate((el) => el.tagName, element);
      if (tagName === "A") {
        console.log("The last element is an <a> tag.");
      } else if (tagName === "SPAN") {
        console.log("The last element is a <span> tag. Button is disabled.");
        is_disabled = true;
      } else {
        console.log("The last element is neither an <a> nor a <span> tag.");
        is_disabled = true;
      }
    } else {
      console.log("The element does not exist. Button is disabled.");
      is_disabled = true;
    }

    isBtnDisabled = is_disabled;
    console.log("*** DISABLED:", is_disabled, "***");

    if (!is_disabled) {
      console.log("*** CLICKING NEXT ***");
      await page.click(
        "xpath/html/body/div[1]/div[3]/div/div[1]/div/div/div/div[1]/div[2]/div/ul/li[11]/a"
      );
    }
  }

  fs.writeFileSync("NFLADP.json", JSON.stringify(players));
  console.log("*** DONE ***");
  await browser.close();
})();
