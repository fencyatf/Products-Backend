const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name:String,
    price:Number,
    description:String,
    url:String
})

const Product = mongoose.model('products',productSchema)

module.exports = Product
