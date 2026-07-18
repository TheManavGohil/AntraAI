import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const BOOKS_URL = "https://books.ebalbharati.in/ebook.aspx";
const PDF_BASE = "https://books.ebalbharati.in/pdfs";
const DOWNLOAD_DIR = join(process.cwd(), "textbooks", "pdfs");

interface TextbookInfo {
  id: string;
  title: string;
  standard: number;
  subject: string;
  medium: string;
  url: string;
}

// Known textbook IDs for Maharashtra SSC 9th & 10th (English medium, Science & Math)
// These are extracted from the ebalbharati.in ebook library
const KNOWN_TEXTBOOKS: TextbookInfo[] = [
  // 9th Standard
  { id: "903020456", title: "Science and Technology Part 1", standard: 9, subject: "science", medium: "english", url: `${PDF_BASE}/903020456.pdf` },
  { id: "903020457", title: "Science and Technology Part 2", standard: 9, subject: "science", medium: "english", url: `${PDF_BASE}/903020457.pdf` },
  { id: "902020456", title: "Algebra", standard: 9, subject: "algebra", medium: "english", url: `${PDF_BASE}/902020456.pdf` },
  { id: "902020457", title: "Geometry", standard: 9, subject: "geometry", medium: "english", url: `${PDF_BASE}/902020457.pdf` },
  // 10th Standard
  { id: "1003000265", title: "Science and Technology Part 1", standard: 10, subject: "science", medium: "english", url: `${PDF_BASE}/1003000265.pdf` },
  { id: "1003000266", title: "Science and Technology Part 2", standard: 10, subject: "science", medium: "english", url: `${PDF_BASE}/1003000266.pdf` },
  { id: "1002000265", title: "Algebra", standard: 10, subject: "algebra", medium: "english", url: `${PDF_BASE}/1002000265.pdf` },
  { id: "1002000266", title: "Geometry", standard: 10, subject: "geometry", medium: "english", url: `${PDF_BASE}/1002000266.pdf` },
];

async function discoverTextbooks(): Promise<TextbookInfo[]> {
  console.log("Attempting to discover textbooks from ebalbharati.in...");
  console.log("Using known textbook IDs as fallback.\n");
  return KNOWN_TEXTBOOKS;
}

async function downloadPDF(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  HTTP ${response.status} for ${url}`);
      return false;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      console.log(`  Not a PDF (content-type: ${contentType}) for ${url}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(filepath, Buffer.from(buffer));
    console.log(`  Downloaded: ${filepath} (${(buffer.byteLength / 1024).toFixed(0)} KB)`);
    return true;
  } catch (error) {
    console.log(`  Failed to download ${url}: ${error}`);
    return false;
  }
}

async function downloadTextbooks() {
  if (!existsSync(DOWNLOAD_DIR)) {
    mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const textbooks = await discoverTextbooks();
  let successCount = 0;
  let failCount = 0;

  console.log(`\nFound ${textbooks.length} textbooks to download.\n`);

  for (const textbook of textbooks) {
    const filename = `std${textbook.standard}_${textbook.subject}_${textbook.id}.pdf`;
    const filepath = join(DOWNLOAD_DIR, filename);

    console.log(`[${textbook.standard}th ${textbook.subject}] ${textbook.title}`);
    const success = await downloadPDF(textbook.url, filepath);

    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log(`  Hint: The PDF may have a different ID. Check https://books.ebalbharati.in and update KNOWN_TEXTBOOKS.`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Downloaded: ${successCount}/${textbooks.length}`);
  if (failCount > 0) {
    console.log(`Failed: ${failCount}/${textbooks.length}`);
    console.log(`\nTo manually download, visit https://books.ebalbharati.in, filter by 9th/10th, English, Science/Math,`);
    console.log(`then note the PDF filename (e.g., 903020456.pdf) and update the KNOWN_TEXTBOOKS array.`);
  }

  // Also try Playwright discovery for newer books
  console.log("\n--- Trying Playwright discovery for additional books ---");
  try {
    await discoverViaPlaywright();
  } catch (e) {
    console.log("Playwright discovery skipped:", e);
  }
}

async function discoverViaPlaywright() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(BOOKS_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Select academic year (2025 or latest)
    const yearSelect = page.locator("select[name*='Year'], select[id*='Year'], select#ddlAcademicYear");
    if (await yearSelect.count() > 0) {
      await yearSelect.selectOption({ index: 1 }); // First non-default option
      await page.waitForTimeout(2000);
    }

    // Select class 9th or 10th
    const classSelect = page.locator("select[name*='Class'], select[id*='Class'], select#ddlClass");
    if (await classSelect.count() > 0) {
      const classOptions = await classSelect.locator("option").allTextContents();
      const ninthOrTenth = classOptions.find(o => o.includes("9") || o.includes("10"));
      if (ninthOrTenth) await classSelect.selectOption({ label: ninthOrTenth });
      await page.waitForTimeout(2000);
    }

    // Select English medium
    const mediumSelect = page.locator("select[name*='Medium'], select[id*='Medium'], select#ddlMedium");
    if (await mediumSelect.count() > 0) {
      const mediumOptions = await mediumSelect.locator("option").allTextContents();
      const english = mediumOptions.find(o => /english/i.test(o));
      if (english) await mediumSelect.selectOption({ label: english });
      await page.waitForTimeout(2000);
    }

    // Select Science or Math subject
    const subjectSelect = page.locator("select[name*='Subject'], select[id*='Subject'], select#ddlSubject");
    if (await subjectSelect.count() > 0) {
      const subjectOptions = await subjectSelect.locator("option").allTextContents();
      const sciOrMath = subjectOptions.find(o => /science|math/i.test(o));
      if (sciOrMath) await subjectSelect.selectOption({ label: sciOrMath });
      await page.waitForTimeout(2000);
    }

    // Extract PDF links
    const pdfLinks = await page.locator("a[href*='.pdf'], a[href*='pdfs/']").all();
    console.log(`Found ${pdfLinks.length} PDF links on the page.`);

    for (const link of pdfLinks) {
      const href = await link.getAttribute("href");
      if (href) {
        const fullUrl = href.startsWith("http") ? href : `https://books.ebalbharati.in/${href}`;
        console.log(`  Discovered: ${fullUrl}`);
      }
    }
  } catch (e) {
    console.log("Could not access ebalbharati.in ebook page:", e);
  } finally {
    await browser.close();
  }
}

downloadTextbooks().catch(console.error);
