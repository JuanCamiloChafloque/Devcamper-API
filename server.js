const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const db = require("./config/db");
const errorHandler = require("./middleware/error");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// Init Config ENV Variables
dotenv.config({ path: "./config/config.env" });

const app = express();
const PORT = process.env.PORT || 5000;

//Load Routes
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

//Load Mongoose DB
db();

//Public floder access
app.use(express.static(path.join(__dirname, "public")));

//Morgan Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//FileUpload Middleware
app.use(fileUpload());

//BodyParser Middleware
app.use(express.json());

//CookieParser Middleware
app.use(cookieParser());

//Mongo Sanitize Middleware
app.use(mongoSanitize());

//Helmet Middleware
app.use(helmet());

//Cross-site Scripting XSS-Clean Middleware
app.use(xss());

//HTTP Polution Attack HPP Middleware
app.use(hpp());

//CORS Middleware
app.use(cors());

//RateLimit Middleware
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 mins
  max: 100,
});
app.use(limiter);

//Assign Routes
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

//Custom Error Middleware (Al final de asignar las rutas para que funcione)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Started server on port ", PORT);
});
