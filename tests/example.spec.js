import { test, expect } from '@playwright/test';

const timeout = 600000;
const USER_NAME = process.env.USER_NAME;
const PASSWORD = process.env.PASSWORD;
const COURSE = process.env.COURSE;
const MODULE = process.env.MODULE;
const URL = process.env.URL;

let iteration = 0;

const navigateToNextActivity = async (page) => {
  let nextAcitivityLink = page.locator('a:has-text("Next Activity")');
  console.log(nextAcitivityLink + " found next activity link");
  while (await nextAcitivityLink.count() > 0) {
    iteration++;
    console.log('Completed iterations: ' + iteration);
    await nextAcitivityLink.waitFor({ state: 'visible', timeout: timeout });
    await Promise.all([
      nextAcitivityLink.click(),
      page.waitForLoadState('networkidle')
    ]);

    const summaryText = await page.getByText('Summary of your previous attempts').isVisible();
    if (summaryText) {
      console.log('Skipping quiz re-attempt as its finished previously');
    }
    else if (await page.getByRole('button', { name: 'Re-attempt quiz' }).isVisible()) {
      console.log('Skipping quiz re-attempt');
    }
    else if (await page.getByRole('button', { name: 'Attempt quiz' }).isVisible()) {
      await page.getByRole('button', { name: 'Attempt quiz' }).click();

      //This is the major assigment check
      const startAttemptButton = page.getByRole('button', { name: 'Start attempt' });
      if (await startAttemptButton.isVisible()) {
        await page.screenshot({ path: 'screenshots\start_attempt_modal.png', fullPage: true });
        console.log('Start attempt modal found. Screenshot taken!');
        return; //doubt
      }

      const answer1Locator1 = page.locator('[id *="_answer1_label"]').nth(0);
      if (await answer1Locator1.isVisible()) {
        await answer1Locator1.getByText('b.').click();
        console.log('first answer clicked');
      } else {
        console.log('First answer not found, skipping');
      }

      const answer1Locator2 = page.locator('[id*="_answer1_lable1').nth(1);

      //Check for second question existance
      if (await answer1Locator2.count > 0 && await answer1Locator2.isVisible()) {
        await answer1Locator2.getByText('c.').click();
        console.log('Second answer clicked');
      }
      else {
        console.log('Second answer not found, skipping');
      }

      await page.getByRole('button', { name: 'Finish attempt' }).click();
      await page.getByRole('button', { name: 'Submit all and finish' }).click();

      const submitModalButton = page.getByLabel('Submit all your answers and finish').getByRole('button', { name: 'Submit all and finish' });
      await submitModalButton.click();

      await page.waitForSelector('text=Your attempt has been submitted', { state: 'hidden', timeout: timeout }); // doubt
    }

    nextAcitivityLink = page.locator('a:has-text("Next Activity")');
  }
};

async function tryClickCardWithFallback(page) {
  console.log(COURSE);
  console.log(MODULE);
  console.log('Professional Ethics (PFE301)-Semester V ' == COURSE && 'Module 1' == MODULE);
  const firstCard = page.locator('.single-card').nth('Course name Professional Ethics (PFE301)' == COURSE && 'Module 4' == MODULE ? 0 : 1)
  const secondCard = page.locator('.single-card').nth('Course name Professional Ethics (PFE301)' == COURSE && 'Module 4' == MODULE ? 1 : 0);  
  
  //Helper function to check if the page has navigated successfully
  async function didNavigate() {
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      return true;
    } catch (e) {
      return false;
    }
  }
  // Try clicking the first card
  console.log('Clicking the first card...');
  await firstCard.click();

  if (await didNavigate()) {
    console.log('Successfully navigated after clicking the first card');
    return; //Exit if successful
  }

  //FallBack: Try clicking the second card if the first one didn't  work
  console.log('First card did not navigate. Clicking the second card...');
  await secondCard.click(); // not declared and defined

  //check if the second click worked
  if (await didNavigate()) {
    console.log('Successfully navigated after clicking the second card.');
  } else {
    console.log('Second card did not work either');
  }
}

test('test', async ({ page }) => {
  test.setTimeout(timeout);

  await page.goto(URL);
  await page.screenshot({ path: 'screenshots\initial.png', fullPage: true });
  await page.getByPlaceholder('Username').fill(USER_NAME);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.screenshot({ path: 'screenshots\login.png', fullPage: true });
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.getByRole('link', { name: COURSE }).click();
    await page.getByRole('link', { name: MODULE }).click();

  await tryClickCardWithFallback(page);

  await navigateToNextActivity(page);

  await page.screenshot({ path: 'screenshots\final_screenshot.png', fullPage: true });
})