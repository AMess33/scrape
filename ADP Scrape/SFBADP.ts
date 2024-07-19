const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");

const url = "https://joshadhd.com/sfb/#tab-6068-2";

(async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  // go to sfb page
  await page.goto(url);

  let players = new Array();
  let isBtnDisabled = false;
  let firstPlayer = "";
  // wait for page load
  await page.waitForSelector("text/ADP");

  await page.click("text/ADP");

  await page.waitForSelector(
    "xpath/html/body/div[1]/div/section/div[2]/div/div[2]/div/div[2]/div/div/div[3]/div/div/div/div[1]/div/div[3]/div/table/tbody/tr[1]/td[1]",
    { timeout: 10000 }
  );

  while (!isBtnDisabled) {
    console.log("*** RUNNING SCRAPE ***");
    console.log({ firstPlayer });

    await page.waitForFunction(
      (p) => {
        const player = document.querySelector<HTMLDivElement>(
          "#DataTables_Table_0 > tbody > tr:nth-child(1) > td:nth-child(5)"
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
        "#DataTables_Table_0 > tbody > tr:nth-child(1) > td:nth-child(5)"
      )?.title;
    });
    firstPlayer = first ?? "";

    console.log("*** GETTING PLAYER ROWS ***");

    const playerRows = await page.$$("#DataTables_Table_0 > tbody > tr");

    for (const playerData of playerRows) {
      let rank: number = 0;
      let pos: any = "Null";
      let posRk: any = "Null";
      let team: any = "Null";
      let playerName: any = "Null";
      let drafted: any = "Null";
      let adp: any = "Null";
      let min: any = "Null";
      let max: any = "Null";

      try {
        rank = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(1)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        pos = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(2)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        posRk = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(3)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        team = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(4)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        playerName = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(5)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        drafted = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(6)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        adp = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(7)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        min = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(8)").innerText,
          playerData
        );
      } catch (error) {}

      try {
        max = await page.evaluate(
          (el: any) => el.querySelector("td:nth-child(9)").innerText,
          playerData
        );
      } catch (error) {}

      if (rank !== 0) {
        players.push({
          rank,
          pos,
          posRk,
          team,
          playerName,
          drafted,
          adp,
          min,
          max,
        });
      }
    }

    console.log("*** FINDING NEXT BTN ***");

    await page.waitForSelector("#DataTables_Table_0_next", {
      visible: true,
    });

    const is_disabled =
      (await page.$(".paginate_button.next.disabled")) !== null;

    isBtnDisabled = is_disabled;
    console.log("*** DISABLED:", is_disabled, "***");

    if (!is_disabled) {
      console.log("*** CLICKING NEXT ***");
      await page.click("#DataTables_Table_0_next");
    }
  }

  fs.writeFile("SFB_ADP.json", JSON.stringify({ players }), (err: any) => {
    if (err) throw err;
  });

  await browser.close();
})();
