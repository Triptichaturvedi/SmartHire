# SmartHire

SmartHire is a React/Vite recruitment frontend with an Express, MongoDB, and Mongoose API.

## Setup

1. Install dependencies in both `frontend` and `backend`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Set `MONGODB_URI` to the MongoDB Atlas connection string for your own development database. Do not commit the file.
4. Set a long random `JWT_SECRET`. `CLIENT_URL` must match the browser origin.
5. Start the API with `npm run dev` from `backend`, then the frontend with `npm run dev` from `frontend`. For a separate frontend host, copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL` to the deployed API `/api/v1` URL.

The API starts even when MongoDB is unreachable, but `/api/v1/health` reports HTTP 503 and database-backed features remain unavailable. Atlas setup still requires a valid cluster hostname, a database user/password, and a Network Access rule allowing the development machine. Connection errors are reported without printing credentials.

## Demo jobs

Demo data is created only by the explicit seed command. Set `DEMO_RECRUITER_EMAIL` and `DEMO_RECRUITER_PASSWORD` in the environment, then run `npm run seed` from `backend`. The command marks every inserted job with `demo: true`.

## API and security

Authentication uses an HttpOnly, SameSite cookie containing a short-lived signed session token. Passwords are hashed with bcryptjs. Registration never accepts the `admin` role; administrator accounts must be provisioned outside the public registration endpoint. Recruiter job and applicant operations enforce ownership on the server. Keep `COOKIE_SAMESITE=lax` for same-site deployments; for separate HTTPS frontend/API sites use `COOKIE_SAMESITE=none` and keep `NODE_ENV=production` so the cookie remains `Secure`.

Resumes use the `LocalPrivateResumeStorage` adapter in `backend/storage/resumeStorage.js`. Files are outside the public directory, gitignored, validated as PDF/DOCX files with a 5 MB limit, and can only be downloaded through authenticated candidate or owning-recruiter endpoints. For a single production API instance, set `RESUME_STORAGE_DIR` to a private persistent mounted volume. For multiple instances, implement the same adapter contract against private object storage and set `RESUME_STORAGE` only after that adapter is added; the application intentionally rejects unknown providers.

## Verification

Run `npm run build` and `npm run lint` in `frontend`. Run `npm test` and `node --check server.js` in `backend`. The default tests never connect to or mutate MongoDB. Full authentication, ownership, duplicate-application, status-transition, resume-authorization, notifications, moderation, and persistence tests run only with an isolated test database:

```powershell
cd SmartHire\backend
$env:MONGODB_TEST_URI="mongodb://127.0.0.1:27017/smarthire_test"
npm run test:integration
```

The integration harness refuses to run unless `MONGODB_TEST_URI` is a valid MongoDB URI with a database name containing `test`, and it differs from `MONGODB_URI`. It drops only that explicitly configured test database before and after the suite. Never point it at a development or production database.

For Atlas integration testing, copy `backend/.env.test.example` to `backend/.env.test` and replace its placeholder with the dedicated test URI. The test runner loads `backend/.env.test` separately from the development `backend/.env`; `.env.test` is ignored by Git and must never contain a development or production database URI.

Manual smoke checklist:

1. Start the backend and confirm `GET http://localhost:5000/api/v1/health` returns HTTP 200 and `database.connected: true`.
2. Register a student, log out, log back in, refresh `/api/v1/auth/me`, and update the student profile.
3. Register a recruiter, create a draft job, publish it, and confirm the student can find it through `/api/v1/jobs`.
4. Submit one application as the student; confirm a second submission for the same job returns HTTP 409.
5. Review the application as the recruiter, change its status, and confirm the student sees both the new status and a notification.
6. Mark the notification read and confirm its `read` value persists after another notification fetch.
7. Upload, replace, download, and delete a student resume. Confirm an unrelated recruiter cannot download it or edit the owning recruiter’s job.
8. Confirm unauthenticated requests receive HTTP 401, non-admin users receive HTTP 403 from admin endpoints, and an admin can suspend a non-admin account.

The checklist is not a substitute for the isolated integration suite. Record each HTTP status and response before release; do not use real user records for test identities.

## Deployment

Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`, `NODE_ENV=production`, `COOKIE_SAMESITE`, `RESUME_STORAGE`, and `RESUME_STORAGE_DIR` on the API host. Use a dedicated least-privilege MongoDB database/user and configure Atlas Network Access for only the API host. Serve both hosts over HTTPS; production cookies are HttpOnly and Secure. Use `COOKIE_SAMESITE=lax` for same-site hosting or `none` only when the frontend and API are separate HTTPS sites. Set `VITE_API_BASE_URL` only to the public API base URL; never put MongoDB credentials or JWT secrets in frontend variables. Keep resumes on a private persistent volume or add a private object-storage adapter before using multiple API instances. Check `GET /api/v1/health` after deployment and require HTTP 200 with `database.connected: true`.

The included `render.yaml` describes the backend web service and frontend static site. Set all `sync: false` values in Render; no secret values are stored in the repository. The backend health check is `/api/v1/health`. Local resume storage is private but ephemeral unless a Render persistent disk is mounted at `/var/data`; use private object storage for durable multi-instance production storage.

Local commands:

```powershell
cd SmartHire\backend
npm install
npm test
npm start

cd ..\frontend
npm install
npm run lint
npm run build
npm run preview
```
