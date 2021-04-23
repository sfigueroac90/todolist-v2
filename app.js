//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-sf:test12345@cluster0.szxjz.mongodb.net/ToDoListDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);


var items = [];

const item1 = Item({
  name: "Go to the market",
})

const item2 = Item({
  name: "Go to the pet store",
})

const item3 = Item({
  name: "Study a lot",
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema);
/*
Item.insertMany(defaultItems,(err)=>{
  if(err){
    console.log(err)
  } else {
    console.log("Success in items");
  }
});
*/



const workItems = [];



app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (!err)
        if (foundList){
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        }
  });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;

  console.log(req.body)

  if(listName === "Today"){
    Item.findByIdAndDelete({ _id: checkedItemId }, (err) => {
      if (!err) {
        console.log("Deleted");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name: listName}, 
      {$pull: {items: {_id: checkedItemId}}},
      {useFindAndModify: false}
    ,(err)=>{
        if(!err){
          res.redirect("/" + listName);
        }
      })
  }

  

})
app.get("/:customListName", (req, res) => {
  const customLisName =_.capitalize(req.params.customListName || "Today")  ;
  console.log(customLisName);

  List.findOne({ name: customLisName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customLisName,
          items: defaultItems
        })
        list.save((err) => {
          if (!err) {
            res.render("list", { listTitle: list.name, newListItems: list.items })
          }
        });

      } else {
        // Show existing list
        console.log("List  exists");
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  })

});

app.get("/", function (req, res) {
  updateItems((docs) => {
    res.render("list", { listTitle: "Today", newListItems: docs });
  });

});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});


function updateItems(callback) {
  Item.find((err, docs) => {
    items = [];
    if (!err) {
      console.log(docs);
      docs.forEach((doc) => {
        items.push(doc.name);
      })
      callback(docs);
    }
  })
}

function getDocs(callback) {
  Item.find((err, docs) => {
    items = [];
    if (!err) {
      console.log(docs);
      callback(docs);
    }
  })
}