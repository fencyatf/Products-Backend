require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')

const app = express()
const port = process.env.PORT
const secretKey = "secret123"


app.use(express.json())
app.use(cors({
    origin: 'https://products-frontend-ojn6.onrender.com',  
    credentials: true       //http://localhost:3000
}));


app.get('/',(req,res)=>{ 
    res.send("Form the server")
})

const url = process.env.MONGODB_URL

async function main() {
    console.log(url)
    await mongoose.connect(url)
}

main() 
    .then(()=>console.log("DB connected"))
    .catch((error)=>console.log(error))

//Token Authentication

const authenticateToken = (req,res,next) =>{
    const token = req.headers['authorization']?.split(' ')[1]
    if(!token) return res.status(401).json({error:"Token not provided"})

    jwt.verify(token,secretKey,(err,user)=>{
        if(err) return res.status(403).json({error:"Invalid token", err:err})
            req.user = user
            next()
    })
}

const Product = require('./model/product')

//Get all products
app.get('/products', async (req,res)=>{
    try {
        const products = await Product.find()
        res.status(200).json(products)
    } catch (error) {
        res.status(400).json(error)
    }
})

//Create a product
app.post('/products',async(req,res)=>{
    try {
        const product = new Product(req.body)
        await product.save()
        res.status(201).json(product)
    } catch (error) {
        res.status(400).json(error)
    }
})


// app.post("/products", async (req, res) => {
//     try {
//         const { name, price, description, url } = req.body;

//         // 🔹 Check if required fields exist
//         if (!name || !price || !description || !url) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         console.log("Received data:", req.body); // Debugging log

//         const newProduct = new Product({ name, price, description, url });
//         await newProduct.save();

//         res.status(201).json({ message: "Product created successfully", product: newProduct });
//     } catch (error) {
//         res.status(500).json({ message: "Error while creating the product", error: error.message });
//     }
// });


//Get product by ID
app.get('/products/:id',async (req,res)=>{
    try {
        const productId = req.params.id
        const product = await Product.findById(productId)
        if(!product){
            return res.status(404).json({message:'Product not found'})
        }else{
            res.status(200).json(product)
        }
    } catch (error) {
        res.status(400).json(error)
    }
})

//Update a product
app.patch('/products/:id',async(req,res)=>{
    try {
        const productId = req.params.id
        const product = await Product.findByIdAndUpdate(productId,req.body,{new:true})
        res.status(200).json(product)
        
    } catch (error) {
        res.status(400).json(error)
    }
})

//Delete product
app.delete('/products/:id',async(req,res)=>{
    try {
        const productId = req.params.id
        const product = await Product.findByIdAndDelete(productId)
        if(!product){
            return res.status(404).json({message:'Product not found'})
        }else{
            res.status(200).json({message:"Product deleted successfully"})
        }
    } catch (error) {
        res.status(400).json(error)
    }

})


//Get product count for price greater than input price
app.get('/products/count/:price',async(req,res)=>{
    try {
        const price = Number(req.params.price)
        const productCount = await Product.aggregate([
            {
                $match:{price:{$gt:price}}
            },
            {
                $count:"productCount"
            },
        ])
        res.status(200).send(productCount)
    } catch (error) {
        res.status(400).json(error)
    }
})



const User = require('./model/user')

//Signup route
app.post('/user', async(req,res)=>{
    try {

        const saltRounds = 10
        bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
            // Store hash in your password DB.
            if(err){
                console.error("Error occured while hashing",err)
                res.status(500).json({error:"Internal server error"})
            }
            var userItem = {
                name:req.body.name,
                email:req.body.email,
                password:hash,
                createdAt:new Date()
            }
            var user = new User(userItem)
            await user.save()
            res.status(201).json({message:"Signup Successfull",user:user})
        });       
    } catch (error) {
        res.status(400).json(error)
    }
})

//Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(500).json({ error: "User not Found" });
    }
    console.log(password)
    console.log(user.password)
    const isValid = await bcrypt.compare(password,user.password);
    if (!isValid) {
      return res.status(500).json({ error: "Invalid Credentials" });
    }
    //Token creation
    let payload = { user: email };

    let token = jwt.sign(payload, secretKey);
    res.status(200).json({ message: "Login Successfully", token: token });
  } catch (error) {
    res.status(400).json(error);
  }
})


app.listen(port,()=>{
    console.log('Server started')
})