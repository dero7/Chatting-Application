const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { Router } = require("express");

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  // const token = await new Token({
  //   userId: user._id,
  //   token:crypto.randomBytes(32).toString("hex")
  // }).save();
  // const url = `${process.env.BASE_URL}users/${user._id}/verify/${token.token}`;
  // await sendEmail(user.email,"Verify Email",url);

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

//for verify account
// const authUser = asyncHandler(async (req, res) => {
//   const { email, password ,verified} = req.body;

//   const user = await User.findOne({ email });

//   if (user && (await user.matchPassword(password)) && verified) {
//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       isAdmin: user.isAdmin,
//       pic: user.pic,
//       token: generateToken(user._id),
//     });
//   } else {
//     res.status(401);
//     throw new Error("Invalid Email or Password");
//   }
// });

// router.get("/:id/verify/:token",async(req,res)=>){
//   try{
//     const user = await User.findOne({_id:req.params._id});
//     if(!user) return res.status(400).send({message:"Invalid Link"});
//     const token = await Token.findOne({
//       userId : user._id,
//       token : req.params.token
//     });
//     if(!token) return res.status(400).send({message:"Invalid Link"});
//     await User.updateOne({_id:user._id,verified:true});
//     await token.remove();
//     res.status(200).send({message:"Email Verified Successfully"});
//   }catch(error){
//     res.status(500).send({message:"Internal Server Error"});
//   }
// }

module.exports = { allUsers, registerUser, authUser };
