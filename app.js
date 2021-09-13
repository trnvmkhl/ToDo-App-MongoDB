//jshint esversion:6

const express = require("express");
// Врубаем монгус
const mongoose = require('mongoose');
// const date = require(__dirname + "/date.js");
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// Работа с бд

// Указываем адрес бд
mongoose.connect('mongodb+srv://admin-mikhail:Test123@cluster0.aczku.mongodb.net/todoListDB', {useNewUrlParser: true, useUnifiedTopology: true,  useFindAndModify: false });
// Создаем новую схему
const itemsSchema = new mongoose.Schema ({
  name: String
});
// Создаем модель
const Item = mongoose.model('Item', itemsSchema);

// Кидаем дефолтные значения
const firstExample = new Item ({
  name: 'First Example'
});

const secondExample = new Item ({
  name: 'Second Example'
});

const thirdExample = new Item ({
  name: 'Third Example'
});

const defaultItems = [firstExample, secondExample, thirdExample];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);



app.get("/", function(req, res) {
  // Читаем данные в бд
  Item.find(function (err, items) {
    // Проверка на дефолтные значения, чтобы монгус не добавлял их при каждом запуске заново
    if (items.length === 0) {
      Item.insertMany(defaultItems, (e) => {
        if (e) {
          console.log(e);
        } else {
          console.log("Saved your examples");
        }
      });
      // Иначе страница будет висеть, ведь мы просто добавили данные выше
      res.redirect("/");
    } else {
      // Читаем туду из бд
      console.log(items);
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});


// Добавляем новые туду айтемы через инпут
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  // ТК туду листы мы можем создавать любые сторонние
  // Нужно сделать так, чтобы мы могли в именно в них добавлять айтемы
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, (e, foundList) => {
      foundList.items.push(item);
      foundList.save(()=>res.redirect('/' + listName));
      
    })
  }

  

});

// Удаляем айтемы при нажатии на чекбокс
app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;

  // Делаем возможным удаление из кастомных листов
  const listName = req.body.listName;

  if(listName === "Today") {
    console.log(checkedItemId);
    Item.findByIdAndRemove(checkedItemId, (e) => {
      if (e) {
        console.log(e)
      } else {
        console.log('I delete the item!!!')
        res.redirect('/');
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (e, foundList)=>{
      if (!e){
        res.redirect('/' + listName);
      }
    });
  }

  

})

// Делаем разные туду листы, пишем любой адрес
app.get('/:customListName', (req,res) => {
  // Через лодаш делаем всегда название с большой буквы
  const customListName = _.capitalize(req.params.customListName);

  // Сохраняем это в бд

  List.findOne({name: customListName}, (e, results) => {
    if (!e){
      if (!results) {
        console.log('doesnt exist!');
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        
        list.save(() => res.redirect('/' + customListName));
      } else {
        console.log('its ok!!!')
        res.render('list', { listTitle: results.name, newListItems: results.items })
      };
   }
    });
  });


app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log("Server started on port 3000");
});
