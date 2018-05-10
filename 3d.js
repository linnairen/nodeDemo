var http = require('http');
var qs = require('querystring');

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'main'
});
 
connection.connect();
 


var server = http.createServer(function (req, res) {
    res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8",
    	"Access-Control-Allow-Origin": "*",
    	"Access-Control-Allow-Headers": "Content-Type,Content-Length, Authorization, Accept,X-Requested-With",
    	"Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS"
    });
    var url_info = require('url').parse(req.url, true);
    var post = '';
    if(url_info.pathname === '/test'){
        if(req.method != "POST"){
            res.end("{'msg':'请求类型错误'}")
        }
        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function(chunk){    
            post += chunk;
        });
     
        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function(){
            // post = JSON.parse(post)
            if(post.msg){
                res.end('我是一条来自http://127.0.0.1:8888的数据' + post.msg);
            }
            else{
                res.end('我是一条来自http://127.0.0.1:8888的数据');
            }
        });
    }
    if(url_info.pathname === '/getRegularCubes'){
        connection.query('SELECT name,type_name,color,arg1,arg2,arg3,arg4,pos_x,pos_y,pos_z from regular_cubes,types where types.type_id = regular_cubes.type', function (error, results, fields) {
            if (error) throw error;
            var cubes = []
            for(var i = 0;i < results.length;i++){
                cubes[i] = {
                    name: results[i]['name'],
                    type: results[i]['type_name'],
                    color: results[i]['color'],
                    size: {
                        arg1: results[i]['arg1'],
                        arg2: results[i]['arg2'],
                        arg3: results[i]['arg3'],
                        arg4: results[i]['arg4']
                    },
                    position: {
                        x: results[i]['pos_x'],
                        y: results[i]['pos_y'],
                        z: results[i]['pos_z']
                    }
                }
            }
            res.end(JSON.stringify(cubes))
        });
    }
    if(url_info.pathname === '/'){
        res.end('欢迎使用我的接口')
    }
    
}).listen(8787);
//在server关闭的时候也关闭mysql连接
server.on('close',function(){
    connection.end();
});
console.log('Server running at http://127.0.0.1:8787/');