//Package Imports
const cors= require('cors');
const express= require('express');
const compression= require('compression');
const mongoose= require('mongoose');
require("dotenv").config();

//File Imports
const payment= require("./routes/payment");
const logger = require('./utils/logger.util');
const morganMiddleware= require("./middlewares/morgon.middleware");
const swaggerDocs = require('./swagger');

const app= express()
//Mongo Connection
mongoose.connect(process.env.MONGO_DB_URL);
mongoose.connection.on("connected", () => {
  logger.info("Mongo DB Connected");
}); 


//Applying Middlwares
app.use(express.json())
app.use(cors());
app.use(morganMiddleware)
app.use(compression({
  level:6,
  threshold:0,
  filter:(req,res)=>{
      if(req.header['x-no-compression'])
      {
          return false;
      }
      return compression.filter(req,res);
  }
}))

//Redirecting Routes
app.use('/api/payment',payment);

  
// Listening
app.listen(5000,()=>{
  logger.info(`Project is running on port 5000`);
  swaggerDocs(app,5000);
})
