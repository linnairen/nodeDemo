var http = require('http');
var qs = require('querystring');

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'world'
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
    if(url_info.pathname === '/language'){
        connection.query('SELECT distinct Language from countrylanguage where IsOfficial="T"', function (error, results, fields) {
            if (error) throw error;
            for(var i = 0;i < results.length;i++){
                post += "<div>"+ results[i].Language +"</div>"
            }
            res.end('<div>你好,你请求的的地址是'+req.url+',以下为数据库中存在经过认证的语言</div>'+post)
        });
    }
    if(url_info.pathname === '/'){
        res.end('欢迎使用我的接口')
    }
    
}).listen(8888);
//在server关闭的时候也关闭mysql连接
server.on('close',function(){
    connection.end();
});
console.log('Server running at http://127.0.0.1:8888/');