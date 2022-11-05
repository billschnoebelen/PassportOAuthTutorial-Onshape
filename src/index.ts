import { IMongoDBUser } from "./types";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import User from "./User";
const OnshapeStrategy = require("passport-onshape").Strategy;

dotenv.config();

const app = express();

mongoose.connect(
  `${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}`,
  {},
  () => console.log("connected to mongoose successfully")
);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use((req, res, next) => {
  console.log("req", req.method, req.url);
  //   console.log("req", req.url);
  next();
});

app.set("trust proxy", 1);

const cookieName = "mimi";

app.use(
  session({
    name: cookieName,
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: `${process.env.ENV}` === "PRODUCTION" ? true : false,
      secure: `${process.env.ENV}` === "PRODUCTION" ? true : false,
      maxAge: 1000 * 60 * 60 * 24 * 7, // One Week
    },
    // genid: function (req) {
    //   return genuuid(); // use UUIDs for session IDs
    // },
  })
);

// app.use(session({
//   genid: function(req) {
//     return genuuid() // use UUIDs for session IDs
//   },
//   secret: 'keyboard cat'
// }))

app.use(passport.initialize());
app.use(passport.session());

// #4 Serialize and store in a cookie
passport.serializeUser((user: IMongoDBUser, done: any) => {
  return done(null, user._id);
});

passport.deserializeUser((id: string, done: any) => {
  User.findById(id, (err: Error, doc: IMongoDBUser) => {
    return done(null, doc);
  });
});

// #2 Configure the Onshape strategy for use by Passport
passport.use(
  new OnshapeStrategy(
    {
      authorizationURL: "https://oauth.onshape.com/oauth/authorize",
      tokenURL: "https://oauth.onshape.com/oauth/token",
      userProfileURL: "https://oauth.onshape.com/api/users/sessioninfo",
      clientID: process.env.ONSHAPE_CLIENT_ID,
      clientSecret: process.env.ONSHAPE_CLIENT_SECRET,
      callbackURL: process.env.ONSHAPE_CALLBACK,
    },
    function verify(
      accessToken: any,
      refreshToken: any,
      profile: any,
      cb: any
    ) {
      console.log("accessToken", accessToken);
      console.log("refreshToken", refreshToken);
      // Gets called on successful authentification
      // Insert user into database
      User.findOne(
        { onshapeId: profile.id },
        async (err: Error, doc: IMongoDBUser) => {
          if (err) {
            return cb(err, null);
          }

          if (!doc) {
            const newUser = new User({
              onshapeId: profile.id,
              username: profile.displayName,
            });

            await newUser.save();
            cb(null, newUser);
          }
          cb(null, doc);
        }
      );
    }
  )
);

// #1 Configure the Onshape strategy for use by Passport
app.get("/auth/onshape", passport.authenticate("onshape"));

// #3 processes the authentication response and logs the user in, after Onshape redirects the user back to the app:
app.get(
  "/auth/onshape/callback",
  passport.authenticate("onshape", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("http://localhost:3000");
  }
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// This deserializes the user behind the scenes
app.get("/getUser", (req, res) => {
  console.log("getUser req.user", req.user);
  console.log("req.sessionID", req.sessionID);
  res.send(req.user);
});

// logout does not clear the cookie
app.post("/auth/logout", function (req, res, next) {
  console.log("logout called");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    // res.clearCookie(cookieName);
    res.send("done");
  });
});

app.listen(process.env.PORT || 8000, () => {
  console.log("Server Started on port 8000");
});
