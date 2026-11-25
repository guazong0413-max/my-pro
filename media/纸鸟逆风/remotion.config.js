const {Config} = require('@remotion/cli/config');
const {existsSync} = require('node:fs');
const {join} = require('node:path');

const windowsChrome = process.platform === 'win32' && process.env.ProgramFiles
  ? join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe')
  : undefined;
const browser = process.env.REMOTION_BROWSER_EXECUTABLE || windowsChrome;
if (browser && existsSync(browser)) Config.setBrowserExecutable(browser);
