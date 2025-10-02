const express=require("express");
const app=express();
const registerPatient=require("./controllers/registerPatient.js");
const loginPatient=require("./controllers/loginPatient");

//middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.set("view engine","ejs");

//homepage
app.get("/",function(req,res){
    res.render("home");
})

//register   
app.get("/register",function(req,res){
    res.render("register");
})

app.post("/register",registerPatient);


//login
app.get("/login",function(req,res){
    res.render("login");
})

app.post("/login",loginPatient);


//profile
app.get("/profile",profilePatient);



app.listen(3000,function(){
    console.log("server running at port 3000");
});