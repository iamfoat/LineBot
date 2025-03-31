const db = require("../db")

const CreateIngredient = async (req , res) => {
    try{
        const {Ingredientname , Quantity } = req.body;


        await db.query (
            "INSERT INTO Ingredient2 (Ingredient_name,Quantity) VALUES(?,?)",
            [Ingredientname,Quantity]
        );
        res.status(201).json({message:"success"});
    } catch{
        res.status(500).json({ error: "error" });
    }
}

module.exports = {
    CreateIngredient
}