const   mongoose              = require("mongoose"),
        passport              = require("passport"),
        LocalStrategy         = require("passport-local"),
        passportLocalMongoose = require("passport-local-mongoose");


//User schema
var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    ads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet"
    }]
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);

//Adding functions to passport from passport local and passport local mongoose
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Export the model
module.exports = User;