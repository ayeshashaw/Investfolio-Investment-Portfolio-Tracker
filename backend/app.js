require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');
const UserRouter = require('./routes/userRoutes.js');
const serverless = require('serverless-http');

const app = express();

app.use(express.json());

// Configure CORS
app.use(cors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    optionsSuccessStatus: 204
}));

// Routes
app.use("/api/user", UserRouter);

// Connect DB
connectDB.then(() => {
    console.log("Database connected successfully.");
}).catch((err) => {
    console.log("Database Connection Error", err);
});

// DO NOT call app.listen()
// Just export the serverless version
module.exports = serverless(app);
