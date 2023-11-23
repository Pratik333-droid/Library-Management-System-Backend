import express from 'express'
import mongoose from 'mongoose'
import bookRouter from './routers/bookRouter.js'
import userRouter from './routers/userRouter.js'
import requestRouter from './routers/bookRequestRouter.js'
import fineHistoryRouter from './routers/fineHistoryRouter.js'
import cors from 'cors'
import session from 'express-session'

const app = express()
app.use(cors())
app.use(session(
    {
        secret: 'appunkasecret', 
        //this secret is a salt(probably) which is used to create hash that is used to sign the session id cookie
        //this prevents the cookie from being tampered with
        cookie:{sameSite: 'strict', maxAge: 24*60*60*1000},
        resave: false,
        saveUninitialized: true
    } 
))


const PORT = 3500
const MONGODB_URL = 'mongodb+srv://rootjoe349:npohpeC051@bookstore.imyfwe2.mongodb.net/BookStore?retryWrites=true&w=majority'

app.use('/book', bookRouter)
app.use('/user', userRouter)
app.use('/book-request', requestRouter)
app.use('/fine', fineHistoryRouter)

mongoose.connect(MONGODB_URL)
    .then(() => { app.listen(PORT, () => { console.log(`The app is listening to the port ${PORT}`) }) })
    .catch((err) => { console.log(`error = ${err}`) })


