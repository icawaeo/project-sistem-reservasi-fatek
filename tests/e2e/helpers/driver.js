const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const CHROME_BINARY =
  process.env.CHROME_BINARY || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function buildDriver() {
  const options = new chrome.Options();
  const service = new chrome.ServiceBuilder(chromedriver.path)
    .setStdio("ignore");

  options.setChromeBinaryPath(CHROME_BINARY);
  options.excludeSwitches("enable-logging", "enable-automation");
  if (process.env.E2E_HEADLESS !== "0") {
    options.addArguments("--headless=new");
  }

  options.addArguments("--window-size=1366,768");
  options.addArguments("--disable-gpu");
  options.addArguments("--disable-gpu-sandbox");
  options.addArguments("--disable-webgl");
  options.addArguments("--disable-webgl2");
  options.addArguments("--disable-3d-apis");
  options.addArguments("--disable-accelerated-2d-canvas");
  options.addArguments("--disable-accelerated-video-decode");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-logging");
  options.addArguments("--disable-gpu-compositing");
  options.addArguments("--disable-software-rasterizer");
  options.addArguments("--disable-features=VizDisplayCompositor,UseSkiaRenderer,CanvasOopRasterization");
  options.addArguments("--use-angle=swiftshader");
  options.addArguments("--log-level=3");
  options.addArguments("--remote-debugging-pipe");
  options.addArguments("--silent");
  options.addArguments("--no-sandbox");

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
}

module.exports = {
  BASE_URL,
  buildDriver,
};
