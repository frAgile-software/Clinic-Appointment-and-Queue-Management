# Clinic Appointment and Queue Management
- This is frAgile Software's web app, created for our 3rd year Software Design project at WITS university :D.

- Visit the website - [Clinics and Qs](https://clinicsandqs-h6erh6b5gdf8a6h4.southafricanorth-01.azurewebsites.net/).

## Setup and run
The following are all run from the root

Copy the example env files, and FILL IN the environment secrets (given in the access instructions):
```bash 
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local
```

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

- You can also use `npm run dev` in /server, and `npm run start` in /client to run each independently (wouldn't recommend).

You can also code coverage with
```
npm run coverage
```