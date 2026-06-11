require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGODB_URI);
const itemSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  name: "Buy food"
});
const item2 = new Item({
  name: "Cook food"
});
const item3 = new Item({
  name: "Eat food"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = new mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}).then(function (foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then(function () {
          console.log("Successfully saved in database");
        })
        .catch(function (err) {
          console.log(err);
        });
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
    .catch(function (err) {
      console.log(err);
    });
});

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
    List.findOne({ name: listName })
      .then(function (foundList) {

        console.log("List Name:", listName);
        console.log("Found List:", foundList);
        console.log("Item Being Added:", itemName);

        foundList.items.push(item);

        foundList.save();

        console.log("Saved successfully");

        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

});

app.post("/delete", function (req, res) {
  const itemCheckedID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(itemCheckedID).then(function () {
      console.log("Successfully deleted checked item");
      res.redirect("/");
    })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate({
      name: listName //the name of the list that has to be searched
    }, {
      //once the list is found, how are we goiknd to update it
      $pull: { items: { _id: itemCheckedID } }
    }).then(function (foundList) { res.redirect("/" + listName) })
      .catch(function (err) { console.log(err); });
  }

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        //creating new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      }
      else {
        //show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) { });

})

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
// C57tnGrqfUV5SytZ