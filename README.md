# Clinic Appointment and Queue Management
- This is frAgile Software's web app, created for our 3rd year Software Design project at WITS university :D.

## Setup and run
The following are all run from the root

Install all dependencies:
```bash
npm run setup
```
To run both server and client locally concurrently:

```bash
npm run dev
```

- Which runs:

    - `nodemon --env-file=.env index.js` in /server, and 
    - `react-scripts start` in /client.

- You can also use `npm run dev` in /server, and `npm run start` in /client to run each independently.

Remember to copy the example files:
```bash 
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local
```