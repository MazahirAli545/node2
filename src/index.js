import express from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import pkg from 'twilio/lib/twiml/MessagingResponse.js';

const { Message } = pkg;


const app = express();
app.use(express.json());
dotenv.config()

app.get("/pincode", (req, res) => {
    res.json({ message: "hello world "})
})

const PORT = process.env.PORT || 3000;

app.use("/api/user",userRouter)

app.listen(PORT,()=>{console.log("Server listening on port",PORT);
})