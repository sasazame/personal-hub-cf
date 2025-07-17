import { Page } from '@playwright/test';
import { GoalTypes, type GoalType } from '@personal-hub/shared';

export async function createGoals(
  page: Page, 
  count: number, 
  options: {
    titlePrefix?: string;
    type?: GoalType;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const {
    titlePrefix = 'Goal',
    type = GoalTypes.DAILY,
    startDate = new Date(),
    endDate = new Date()
  } = options;

  for (let i = 1; i <= count; i++) {
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill(`${titlePrefix} ${i}`);
    await page.getByLabel('Type').selectOption(type);
    await page.getByLabel('Start Date').fill(startDate.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(endDate.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();
    
    // Wait for goal to appear in list
    await page.waitForSelector(`text="${titlePrefix} ${i}"`, { state: 'visible' });
  }
}

export async function createSingleGoal(
  page: Page,
  goal: {
    title: string;
    description?: string;
    type?: GoalType;
    targetValue?: string;
    unit?: string;
    startDate?: Date;
    endDate?: Date;
    color?: string;
  }
) {
  const {
    title,
    description,
    type = GoalTypes.MONTHLY,
    targetValue,
    unit,
    startDate = new Date(),
    endDate = new Date(),
    color
  } = goal;

  await page.getByRole('button', { name: 'Add Goal' }).click();
  await page.getByLabel('Title').fill(title);
  
  if (description) {
    await page.getByLabel('Description').fill(description);
  }
  
  await page.getByLabel('Type').selectOption(type);
  
  if (targetValue) {
    await page.getByLabel('Target Value').fill(targetValue);
  }
  
  if (unit) {
    await page.getByLabel('Unit').fill(unit);
  }
  
  if (color) {
    await page.getByLabel('Color').fill(color);
  }
  
  await page.getByLabel('Start Date').fill(startDate.toISOString().slice(0, 16));
  await page.getByLabel('End Date').fill(endDate.toISOString().slice(0, 16));
  
  await page.getByRole('button', { name: 'Create Goal' }).click();
  
  // Wait for goal to appear
  await page.waitForSelector(`text="${title}"`, { state: 'visible' });
}