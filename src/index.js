import express from 'express'
import db from './config/Database.js'
import router from './routes/index.js' 
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
// import Users from './models/UserModel.js'

dotenv.config()
const app = express()
const port = 5000


try {
    await db.authenticate()
    console.log('Connection has been established successfully.')
    // await Users.sync()
} catch (error) {
    console.error('Unable to connect to the database:', error)
}
app.use(cors({credentials:true, origin:'http://localhost:3000'}))
app.use(cookieParser())
app.use(express.json())
app.use(router)
app.listen(port, () => {
    console.log(`Server Running at http://localhost:${port}`)
})