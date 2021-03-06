var express = require('express');
var app = express();

const redis = require('redis');
const client = redis.createClient();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('This is main page!');
})

app.get('/addTodo', (req, res) => {
    name = req.query.name
    progress = req.query.progress || 0
    pr_max = req.query.progMax || 100
    if (client.exists('todoCount') == 0) {
        client.set('todoCount', 0);
    }
    client.incr('todoCount', (err, id) => {
        var todoName = 'todo_' + id;
        client.hmset(todoName, 'name', name, 'progress', progress, 'progressMax', pr_max);
        client.rpush('todoList', todoName);
        console.log('Created ' + todoName);
        res.send('Success');
    })
})

app.get('/editTodo', (req, res) => {
    id = req.query.id
    name = req.query.name
    progress = req.query.progress
    pr_max = req.query.progMax
    if (id == undefined || name == undefined || progress == undefined || pr_max == undefined) {
        res.send('ARGUMENT_NULL_ERR');
        return;
    }
    client.exists('todo_' + id, (err, ok) => {
        if (ok == 1) {
            client.hmset('todo_' + id, 'name', name, 'progress', progress, 'progressMax', pr_max);
            res.send('Success');
        } else (ok == 0) {
            res.send('TODO_NOT_EXISTS_ERR');
        }
    })
})

app.get('/getTodo', (req, res) => {
    var resList = [];
    client.lrange('todoList', 0, -1, (err, arr) => {
        var loop = new Promise((resolve, reject) => {
            arr.forEach(function(v, i, a) {
                var hashget = new Promise((resolve2, reject) => {
                    client.hgetall(v, function(err2, obj) {
                        resList.push(obj); 
                        resolve2();
                    })
                })
                hashget.then(() => {
                    if (resList.length == a.length) resolve();
                })
            })
        })
        loop.then(() => {
            res.send(resList);
        })
    })
})

app.get('/removeTodo', (req, res) => {
    var id = req.query.id;
    var result = client.del('todo_' + id);
    if (result == 1) {
        client.lrem('todoList', 1, 'todo_' + id);
        res.send('Success');
    } else {
        res.send('Fail');
    }
})

app.get('/manageTodo', (req, res) => {
    res.render('manageTodo.html');
})

app.get('/viewTodo', (req, res) => {
    res.render('todoList.html');
})

var server = app.listen(3000, () => {
    console.log("Express server has started on port 3000");
})