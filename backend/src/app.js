import express from 'express';
import cors from 'cors';
import musicRouter from './routes/musicRoutes.js';
import { connectDB } from './config/db.js';

const app =express();

app.use(cors({
    origin:process.env.CORS_ORIGIN
}));
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb", extended:true}));


app.use("/",musicRouter);


const start = async()=>{
    connectDB();
    app.listen(process.env.PORT,()=>{
        console.log("Listening on port ",process.env.PORT);
    })
}

start();

 