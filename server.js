const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const colors = require('colors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

//Route files

const bootcamp = require('./routes/bootcamps');
const course = require('./routes/courses');
const auth = require('./routes/auth');

//environment files
dotenv.config({ path: './config/config.env' });

const app = express();

//Body Parser

app.use(express.json());

//Cookie Parser

app.use(cookieParser());

//dev level logging from morgan

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//File uploading
app.use(fileUpload());

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Connect to DB

connectDB();
//Mounting the routers

app.use('/api/v1/bootcamps', bootcamp);
app.use('/api/v1/courses', course);
app.use('/api/v1/auth', auth);

//Error middleware (Use after mounting the router)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

//Running the server
const server = app.listen(
  PORT,
  () => `Server running in ${process.env.NODE_ENV} mode on Port ${PORT} `.yellow
);

//Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  server.close(() => process.exit(1));
});
