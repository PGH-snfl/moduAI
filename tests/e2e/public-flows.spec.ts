import { expect, test } from '@playwright/test';

test('검색어를 입력하면 조건 질문을 거쳐 설명 가능한 추천 결과를 보여준다', async ({ page }) => {
  await page.goto('/');

  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole('button', { name: '메뉴 열기' }).click();
  }
  const search = page.locator('input[aria-label="AI 도구 검색"]:visible');
  await expect(search).toBeVisible();
  await search.fill('영상 만들기');
  await search.press('Enter');

  await expect(page).toHaveURL(/\/tools\?q=%EC%98%81%EC%83%81(?:\+|%20)%EB%A7%8C%EB%93%A4%EA%B8%B0/);
  await expect(page.getByText('“영상 만들기”에 맞는 도구를 함께 찾아볼게요')).toBeVisible();

  await page.getByRole('button', { name: '무료로 먼저 사용' }).click();
  await page.getByRole('button', { name: '반드시 필요' }).click();
  await page.getByRole('button', { name: '있으면 좋음' }).click();
  await page.getByRole('button', { name: '쉬운 사용' }).click();

  await expect(page.getByText('“영상 만들기” 맞춤 추천 결과')).toBeVisible();
  await expect(page.getByText(/필수 조건은 필터링하고/)).toBeVisible();
});

test('관계형 카테고리로 디자인 도구를 필터링한다', async ({ page }) => {
  await page.goto('/tools');

  const category = page.getByRole('button', { name: '디자인·이미지' });
  await expect(category).toBeVisible();
  await category.click();

  await expect(page.getByText(/Canva AI|PixAI|Kling AI/).first()).toBeVisible();
});

test('비로그인 사용자는 관리자 페이지에 접근할 수 없다', async ({ page }) => {
  await page.goto('/admin/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
});
