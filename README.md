<h1 align="center">
    GOG GDS
</h1>

<p align="center">
    <img src="https://img.shields.io/github/license/WiLuX-Source/gog-gds?style=flat-square" alt="">
    <img src="https://img.shields.io/github/stars/WiLuX-Source/gog-gds?style=flat-square" alt="">
</p>

> [!IMPORTANT]
>
> There is always a risk when using automation software.
>
> No one is responsible if anything happens to your account.

## Features

- [x] Auto Claim Freebies.
- [x] Unsubscribe newsletter.

## Setup

1. Go to [Google Apps Script](https://script.google.com/home/start) and create a new project with your custom name.
2. Select the editor and paste the content inside `src/main.js`
3. Select "main" and click the "Run" button at the top.
   Grant the necessary permissions and confirm that the configuration is correct (Execution started > completed).
4. Click the trigger button on the left side and add a new trigger.
   Select the function to run: main
   Select the event source: Time-driven
   Select the type of time based trigger: Day timer
   Select the time of day: recommended to choose any off-peak time between 09:00 to 15:00.
