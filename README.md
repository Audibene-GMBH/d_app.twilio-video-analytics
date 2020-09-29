# Twilio Video Analytics | Desktop Application

This is a small application that helps you understand the Network Bandwidth Consumption of Twilio Video Calls. The application runs on the following platforms: Mac, Windows and Linux.

## How to get started

You can follow the steps given below to ensure a smooth and easy way to run the application:
1. Clone the Repository
2. Once you're inside the local repository, run `npm install`
3. Then you can run the app in dev mode by running `npm start`

Once the application starts, you'll see that you need a `<env>.cred` file. You could either __ask the developer__ for a .cred file but I'm pretty sure you'll need a Twilio account for that.
If you have a Twilio Account, this is how you an create a .cred file. 

```
{
    "acc_sid": "YOUR ACCOUNT SID",
    "api_key": "THE API KEY. YOU CAN CREATE THIS FROM THE TWILIO DASHBOARD",
    "api_sec": "THE SECRET KEY, THAT COMES WITH API KEY. YOU CAN CREATE THIS FROM THE DASHBOARD"
}
```

## Building the app for production

Currently this application can be built on Mac OS. You can run the following command: `npm run pack`
