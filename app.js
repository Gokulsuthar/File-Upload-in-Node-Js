import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import userRouter from "./routes/userRoutes.js"
import AppError from "./utils/appError.js"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import compression from "compression"
import mongoSanitize from "express-mongo-sanitize"
import cookieParser from "cookie-parser"
import xss from "xss-clean"
import path from "path"
import globalErrorHandler from "./controllers/errorController.js"
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({path: './config.env'})

const app = express()

app.use('/image', express.static(path.join(__dirname, 'image')));

app.use(helmet())

if(process.env.NODE_ENV == "development") {
    app.use(morgan('dev'))
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 1000,
    message: "Too many request from this IP, please try again in an hour!"
})

app.use("/api", limiter)

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize())

app.use(xss())

app.use(compression());

app.use('/api/v1/users', userRouter);

app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)

export default app