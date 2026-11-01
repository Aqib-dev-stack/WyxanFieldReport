# Wyxan Field Report

A bare React Native CLI + TypeScript app for creating field reports (description plus 1–5 photos) that are queued on the device and uploaded reliably to the backend.

## Project scripts

| Command             | What it does                           |
| ------------------- | -------------------------------------- |
| `npm run android`   | Build and run on Android               |
| `npm run ios`       | Build and run on iOS                   |
| `npm start`         | Start Metro                            |
| `npm test`          | Run Jest                               |
| `npm run lint`      | ESLint (`lint:fix` applies fixes)      |
| `npm run format`    | Prettier write (`format:check` checks) |
| `npm run typecheck` | TypeScript, no emit                    |

## Structure

```
src/
  components/
    common/     AppButton, EmptyState, Fab, IconButton, ProgressBar, Screen → @components
    layout/     AppHeader, NetworkIndicator, OfflineBanner
    report/     ReportCard, StatusBadge, SummaryStrip, PhotoThumbnail
  config/       colors, theme tokens (spacing, radius, sizes, type), constants → @config
  hooks/        useNetworkStatus (live NetInfo), useOutboxReports  → @hooks/*
  mocks/        UI-phase mock data, removed in phase 8               → @mocks
  types/        Report, ReportStatus, OutboxItem                     → @app-types
  navigation/   root stack, main tabs, header adapters, route types  → @navigation
  screens/      Outbox, ServerReports, Compose, ReportDetail, Settings → @screens
  utils/        formatters, report status text / summary / grouping   → @utils/*
  services/ storage/   reserved for upcoming features
```

Path aliases are declared in `tsconfig.json` (type checking) and `babel.config.js` (Metro and Jest). Keep the two lists in sync, along with `ALIASES` in `.eslintrc.js`.

## Navigation

```
RootStack (native stack)
  MainTabs (bottom tabs)
    Outbox (initial)      reports saved on this phone
    ServerReports         "On server": reports the server holds
  Compose                 new report
  ReportDetail            { reportId }
  Settings                opened from the header
```

Every screen uses the same `AppHeader`, with a live network indicator: a green
Wifi icon when online, a dark WifiOff icon plus "Offline" when not.

## Start over (reset)

Settings → **Start over** is the one deliberate reset. Its reach:

| Deletes from this phone                                                | Keeps                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Every local report, in any status, **including ones not uploaded yet** | Reports already on the server (they still show under On server) |
| The app's own copies of the photos                                     | Original photos in the phone's gallery                          |
| Upload progress and retry history                                      | App permissions and settings                                    |

Why this line: "start over" is about this phone (e.g. handing it to another
inspector). The server is the shared record, so a phone can never delete it.
The confirmation counts the reports that haven't reached the server and says
they will be lost for good; the confirm button names that consequence.

Order when wired to real storage (phase 8): stop the upload runner first, so
nothing is mid-flight, then delete the database rows in one transaction, then
delete the app's photo folder.

### After changing Babel or Metro config

Metro caches transformed files and does not notice changes to
`babel.config.js` or `metro.config.js` (e.g. a new path alias). After such a
change, restart it with a clean cache, or imports like `@mocks` fail to
resolve:

```sh
npx react-native start --reset-cache
```

### Android 17 note (debug builds)

On an Android 17 (API 37) device or emulator, the first launch of a **debug**
build asks to "find, connect to, and determine the relative position of nearby
devices". That is `ACCESS_LOCAL_NETWORK`, added by React Native's debug-only
manifest so the app can reach Metro. Release builds don't include it.

---

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
