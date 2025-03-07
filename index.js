//Initialization
const express               = require("express"),
      app                   = express(),
      dotenv                = require("dotenv"),
      mongoose              = require("mongoose"),
      passport              = require("passport"),
      Pet                   = require("./models/pet"),
      User                  = require("./models/user"),
      bodyParser            = require("body-parser");

dotenv.config();

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

//Connecting to database
var mongourl=process.env.MONGO;
mongoose.connect(mongourl, {useNewUrlParser: true});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Success message when connected to database
db.once('open', function() {
    console.log("Sucessfully connected to database!")
  });

//To be able to use external css
app.use(express.static(__dirname + '/public'));

//Passport configuration
app.use(require("express-session")({
    secret: "process.env.SECRET",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Getting fontawesome link from env variables
var fontawesome=process.env.FONTAWESOME;

//Function to pass current user to all routes
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

//ROUTES

//Homepage
app.get("/",function(req,res){
    //Get all the pets from database
    Pet.find({}).populate("user").exec(function(err, pets){
        if(err){
            console.log(err);
        }else{
            res.render("homepage",{pets: pets});
        }
    });
    
});

//Post a new ad
app.get("/new", isLoggedIn,function(req,res){
    res.render("new");
});

app.post("/new", isLoggedIn,function(req, res){
    //Get details from form
    var title = req.body.title,
        imageurl = req.body.imageurl,
        discription = req.body.discription,
        location = req.body.location,
        price = req.body.price,
        user =req.user;

    //Create a new pet object
    var newPet = {
        title: title,
        imageurl: imageurl, 
        discription: discription,
        location: location,
        price: price,
        user: user
     };

     //Push the object to database
     Pet.create(newPet, function(err, newlyCreatedPet){
        if(err){
            res.send(err);
        } else{
            //Look for the user creating the post
            User.findOne({username: req.user.username}, function(err, foundUser){
                if(err){
                    res.send(err);
                } else {
                    //Add the pet posted to user's list of ads
                    foundUser.ads.push(newlyCreatedPet);
                    foundUser.save(function(err, adPushed){
                        if(err){
                            res.send(err);
                        } else {
                            res.redirect("/");
                        }
                    });
                    
                }
            });
        }
     });
});

//AUTH ROUTES

//Signin
app.get("/signin",function(req, res){
    res.render("signin");
});

app.post("/signin", passport.authenticate("local",
{
    successRedirect: "/",
    failureRedirect: "/signin"
}),function(req, res){
});

//Signup
app.get("/signup",function(req, res){
    res.render("signup");
});

app.post("/signup", function(req,res){
    var newUser = new User({username: req.body.username, email: req.body.email});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("signup")
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/");
        });
    });
});

//Logout route
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

//404
app.get("*", function(req, res){
    res.send("Oops! Page not found.");
});

//Login middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/signin");
}

//Port to listen on
port= process.env.PORT || 3000;
app.listen(port, function(){
    console.log("Petexchange app has started");
});