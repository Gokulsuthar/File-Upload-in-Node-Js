import app from './app.js'
import mongoose from 'mongoose'

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
  

const port = process.env.PORT || 3000

export let gfs;
const db = process.env.MONGODB_LOCAL

const connect = mongoose.createConnection(db)

connect.once('open', () => {
  mongoose.connect(db, ()=> {
    console.log("db connedted")
  })
  gfs = new mongoose.mongo.GridFSBucket(connect.db, {
    bucketName: "uploads"
  })
})

mongoose.connect(db).then(() => {
    console.log("Connected to MongoDB")
})


//server listen
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...')
    console.log(err.name, err.message)
    server.close(() => {
      process.exit(1)
    });
})

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully')
    server.close(() => {
      console.log('💥 Process terminated!')
    })
})