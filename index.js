const express = require("express");
const env = require("./config/enviroment");
const logger = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();
require('./config/view-helpers')(app);
const port = 8000;
const expressLayouts = require("express-ejs-layouts");
const db = require("./config/mongoose");
// used for session cookie
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("./config/passport-local-strategy");
const MongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");
const customMWare = require("./config/middleware");
const passportGoogle = require("./config/passport-google-oauth2-strategy");
const passportJWT = require("./config/passport-jwt-strategy");


console.log(env.name)
const sassMiddleware = require("node-sass-middleware");

// const chatSockets = require('./config/chat_sockets').chatSockets(chatServer);
// const chatServer = require('http').Server(app);
// chatServer.listen(5000);
// console.log("Chat server: 5000");

app.use(express.urlencoded());

app.use(cookieParser());

// setup the chat server to be used with socket.io
app.use(logger(env.morgan.mode, env.morgan.options));

const chatServer = require("http").Server(app);
const chatSockets = require("./config/chat_sockets").chatSockets(chatServer);
chatServer.listen(5000);
console.log("chat server is listening on port 5000");

const path = require("path");

if(env.name == 'dovelopment')
{
  app.use(
    sassMiddleware({
      src: path.join(__dirname, env.asset_path, "scss"),
      dest: path.join(__dirname, env.asset_path, "css"),
      debug: true,
      outputStyle: "extended",
  
      prefix: "/css",
    })
  );
  
}
app.use(express.static(env.asset_path));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(expressLayouts);
// extract style and scripts from sub pages into the layout
app.set("layout extractStyles", true);
app.set("layout extractScripts", true);


// set up the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(
  session({
    name: "codeial",
    // TODO change the secret before deployment in production mode
    secret: env.session_cookie_key,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 100,
    },
    store: new MongoStore(
      {
        mongooseConnection: db,
        autoRemove: "disabled",
      },
      function (err) {
        console.log("ERROR: ", err);
      }
    ),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

app.use(flash());
app.use(customMWare.setFlash);

// use express router
app.use("/", require("./routes"));

app.listen(port, function (err) {
  if (err) {
    console.log(`Error in running the server: ${err}`);
  }

  console.log(`Server is running on port: ${port}`);
});
