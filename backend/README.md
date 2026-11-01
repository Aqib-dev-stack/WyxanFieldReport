# Wyxan Field Report — backend

A small API the app uploads reports to: **Express 5 + MongoDB (Mongoose)**,
image files on disk, served statically. TypeScript runs directly on Node 24
(type stripping), so there is no build step.

## Run it

Needs Node 24 and a MongoDB: a local one (`brew install mongodb-community`,
then `brew services start mongodb-community`) or a free MongoDB Atlas cluster.

```sh
cp .env.example .env    # then set MONGODB_URI (Atlas: mongodb+srv://...)
npm install
npm start
```

`.env` is git-ignored: credentials never go into `.env.example` or the repo.
The server prints the database host on startup with the password masked.

The API listens on `http://localhost:4000`. For the app on a phone over USB:

```sh
adb reverse tcp:4000 tcp:4000
```

Settings (all optional) are in `.env.example`.

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm start`         | Run the API                                     |
| `npm run dev`       | Run with restart on file changes                |
| `npm test`          | API tests (Node's test runner, in-memory store) |
| `npm run typecheck` | TypeScript, no emit                             |

## Endpoints

| Method | Path                            | Notes                                                                                                                                                                                       |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUT`  | `/reports/:id/images/:position` | Raw `image/jpeg` body, position 0–4. Over 5,000,000 bytes → **413**. Same slot is overwritten, never duplicated. Optional `X-Content-SHA256` header → **400** if the image arrived damaged. |
| `POST` | `/reports/:id/commit`           | `{ description, imageCount, createdAt }`. All images must be uploaded first, else **409** with `missing: [positions]`. First call **201**, repeats **200** with the same report.            |
| `GET`  | `/reports`                      | Complete (committed) reports only, newest received first, with image URLs.                                                                                                                  |
| `GET`  | `/health`                       | `{ ok: true }`                                                                                                                                                                              |
| `GET`  | `/uploads/<id>/<position>.jpg`  | The stored image.                                                                                                                                                                           |

Errors are JSON: `{ "error": "<code>", "message": "..." }`.

## Why it can't duplicate

- `:id` is a UUID made on the phone. In MongoDB it is the document `_id`, so
  the built-in unique index makes a second copy impossible, even when two
  commits race (the loser gets the stored report back).
- Images are addressed by `(id, position)`: re-sending overwrites the same
  file. Writes go to a temp file that is renamed into place, so a dropped
  upload never leaves a half-written image under the real name.
- Only committed reports are listed, so a half-uploaded report never shows
  up as if it were complete.

**Refusals reach the phone.** When the server refuses an upload (413, 400,
415), it first lets the body arrive (up to 10 MB), then answers. Answering
early makes Node close the connection while the phone is still sending, and the
phone would see a broken connection, which looks temporary, instead of the
status code, and retry forever.

## Chaos modes (testing only)

Enabled when `ENABLE_ADMIN=true` (the default for local runs).

```sh
# Next 2 requests: connection dropped
curl -X POST localhost:4000/admin/chaos -H 'Content-Type: application/json' -d '{"mode":"drop","times":2}'
# Until changed: every image upload gets 413
curl -X POST localhost:4000/admin/chaos -H 'Content-Type: application/json' -d '{"mode":"reject413"}'
# Back to normal
curl -X POST localhost:4000/admin/chaos -H 'Content-Type: application/json' -d '{"mode":"ok"}'
# Delete every report and image
curl -X POST localhost:4000/admin/reset
```

| Mode           | Behaviour                                                      | What the app should do              |
| -------------- | -------------------------------------------------------------- | ----------------------------------- |
| `ok`           | Normal                                                         | —                                   |
| `slow`         | Waits `SLOW_DELAY_MS` before handling                          | Keep going                          |
| `drop`         | Closes the connection, nothing saved                           | Retry                               |
| `lostResponse` | Does the work, then closes the connection instead of answering | Retry; the retry must not duplicate |
| `error500`     | Answers 500                                                    | Retry with backoff                  |
| `reject413`    | Answers 413 to image uploads                                   | Don't retry the same bytes          |
| `hang`         | Never answers                                                  | Time out, then retry                |

Chaos applies to `/reports` only, not to `/health`, `/uploads` or `/admin`.
