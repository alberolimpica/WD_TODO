const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const app = express();
const mongoose = require("mongoose");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin_sara:test123@cluster0.17vw5.mongodb.net/todolistDB");

const itemSchema ={
  name:String
};

/* Default TODO */
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({name:"New ToDo item!"});
const item2 = new Item({name:"Another ToDo item!"});
const item3 = new Item({name:"Wow, now you have three ToDo item!"});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

/*To show the TODOs */
app.get("/", function(req, res) {

  Item.find({}, function(err, results){

    //If the DB is empty, add the defaults
    if(results.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/"); //redirect back to this route
    }else{ //Else, show the items
      res.render("list", {listTitle: "Today", newListItems: results});
    }
  });
});

/*To save a new TODO */
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list; 

  const item = new Item({name:itemName});

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();      
    res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
 
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted!");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull : {items: {_id: checkedItem}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

//This is to check what the user writes after the /
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);  //we use lodash to capitalize the 1st letter

  console.log(customListName);
  List.findOne({name: customListName}, function(err, result){
      if(!err){
        if(!result){
          console.log("Doesn't exist");
          const list = new List({
            name:customListName,
            items:defaultItems
          });
          list.save(); 
          res.redirect("/" + customListName);
        }else{
          console.log("Does exist");
          res.render("list", {listTitle: result.name, newListItems: result.items});
        }
      }
  });

  
});

let port = process.env.PORT;
if(port == null || port ==""){
	port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
