const shortid=require("shortid")
const urlModel=require("../models/urlModel")


const urlShorten= async (req,res)=>{
   
    let data=req.body
    let short= shortid.generate().toLowerCase()
    while(!await urlModel.findOne({urlCode:short})){
        short =shortid.generate().toLowerCase()
    }
    req.body.urlCode=short
    req.body.shortUrl="localhost:3000/"+short
    
    let savedData=await urlModel.create(data)

    res.status(201).send({data:savedData})

}
module.exports={urlShorten}