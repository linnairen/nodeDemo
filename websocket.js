const ws = require('nodejs-websocket');
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'main'
});
 
connection.connect();
const userList = []
/**
 * 判断数组中是否存在字符串
 * @param {Object} a
 * @param {String} str
 * @param {Boolean} key
 */ 
function isInArr(a,str,key){
	for(let i = 0;i < a.length;i++){
    let value = '' 
    if(key){
      value = a[i][key]
      if(value == str){
        return i
      }
    }
    else{
      value = a[i]
      if(value == str){
        return i
      }
    }
	}
	return false
}
/**
 *获取所有的用户
 */
connection.query('select user_id,user_name from user',function(error,results,fields){
  if (error) throw error;
  for(let i = 0;i < results.length;i++){
    userList.push({
      user_id: results[i]['user_id'],
      user_name: results[i]['user_name']
    })
  }
})
var codeList = {
  loginMsg: 555,
  sendMsg: 666
}

function forEach(obj,fun){
  for(let i in obj){
    fun(obj[i],i)
  }
}

var onlineUser = {}
var ol_info = {}
// var arr = []
// var user = []
// var user_id = []
const server = ws.createServer(function(conn) {
  	conn.on('text', function(str) {
  		var info = JSON.parse(str)

  		if(typeof(info) == 'object'){
  			if(info['user_id'] && info['user_id'] != null && isInArr(userList,info['user_id'],'user_id') !== false){ // 判断接收信息中是否存在账号
  				if(onlineUser[info['user_id']]){ // 判断用户是否在线
  					if(conn != onlineUser[info['user_id']].conn){ // 判断用户当前连接管道是否与上次通信相同
              ol_info[info['user_id']] = userList[isInArr(userList,info['user_id'],'user_id')]
              var msgInfo1 = {
                code: 555,
                msg: '你的账号已在其他地方上线',
                from: 'system',
                userList: userList,
                toAll: false,
                online: ol_info
              }
              onlineUser[info['user_id']].conn.send(JSON.stringify(msgInfo1))
              onlineUser[info['user_id']] = {
                'user_name': userList[isInArr(userList,info['user_id'],'user_id')],
                'conn': conn
              }
              var msgInfo2 = {
                code: 555,
                msg: '欢迎回来',
                from: 'system',
                toAll: false,
                userList: userList,
                online: ol_info
              }
              conn.send(JSON.stringify(msgInfo2))
  					}
  					if(info['msg']){ // 判断消息中是否存在需发送的信息
              let forWho = null,msg = info['msg']
              if(info['to']){ // 是否指定发送对象
                if(onlineUser[info['to']]){
                  forWho = info['to']
                }
                else{
                  forWho = info['user_id']
                  if(isInArr(userList,info['to'],'user_id') !== false){
                    msg = '用户已下线'
                  }
                  else{
                    msg = '用户不存在'
                  }
                }
              }
  						forEach(onlineUser,function(item,index){
                if(forWho && onlineUser[forWho].conn != item.conn && onlineUser[info['user_id']].conn != item.conn){ // 分别判断 发送对象是否存在 连接管道是否与发送的对象及当前对象'不相同'
                  return
                }
                var msgInfo = {
                  code: 666,
                  msg: msg,
                  from: info['user_id'] == forWho ? 'system' : info['user_id'],
                  to: forWho,
                  toAll: (forWho ? false : true ),
                  online: ol_info
                }
  							item.conn.send(JSON.stringify(msgInfo))
  						})
  					}
  				}
  				else{
	  				connection.query('select user_name from user where user_id="'+info['user_id']+'"',function(error,results,fields){
  						if (error) throw error;
  						if(results[0]['user_name']){
  							// arr.push(conn)
  							// user.push(results[0]['user_name'])
  							// user_id.push(info['user_id'])
                conn['userinfo'] = {
                  'user_id': info['user_id'],
                  'user_name': results[0]['user_name']
                }
                onlineUser[info['user_id']] = {
                  'user_name': results[0]['user_name'],
                  'conn': conn
  						  }
                ol_info[info['user_id']] = results[0]['user_name']
              }
  						if(info['msg']){
                var msgInfo = {
                  code: 555,
                  msg: info['msg'],
                  from: results[0]['user_name'],
                  toAll: true,
                  userList: userList,
                  online: ol_info
                }
  							forEach(onlineUser,function(item){
                  item.conn.send(JSON.stringify(msgInfo))
  							})
  						}
  						else{
                var msgInfo = {
                  code: 555,
                  msg: results[0]['user_name'] + '上线',
                  from: 'system',
                  toAll: true,
                  userList: userList,
                  online: ol_info
                }
  							forEach(onlineUser,function(item){
                  item.conn.send(JSON.stringify(msgInfo))
  							})
  						}
  					})
  				}
  			}
  			else{
          let msgInfo = {
            code: 555,
            msg: '账号不存在',
            from: 'system',
            toAll: false
          }
  				conn.send(JSON.stringify(msgInfo))
  			}
  		}
      // 打印收到的信息
    	console.log('收到的信息为:' + str);
  	});
  	conn.on('close', function(code, reason) {
      if(conn['userinfo']){
        delete onlineUser[conn['userinfo']['user_id']]
        delete ol_info[conn['userinfo']['user_id']]
        let msgInfo = {
          code: 555,
          msg: conn['userinfo']['user_name'] + '下线',
          from: 'system',
          toAll: true,
          userList: userList,
          online: ol_info
        }
        forEach(onlineUser,function(item,index){
          item.conn.send(JSON.stringify(msgInfo))
        })
        console.log(conn['userinfo']['user_name']+'关闭连接');
      }
      else{
        console.log('关闭连接');
      }
  	});
  	conn.on('error', function(code, reason) {
      if(conn['userinfo']){
        delete onlineUser[conn['userinfo']['user_id']]
        delete ol_info[conn['userinfo']['user_id']]
        let msgInfo = {
          code: 555,
          msg: conn['userinfo']['user_name'] + '下线',
          from: 'system',
          toAll: true,
          online: ol_info
        }
        forEach(onlineUser,function(item,index){
          item.conn.send(JSON.stringify(msgInfo))
        })
        console.log(conn['userinfo']['user_name']+'异常关闭');
      }
      else{
        console.log('异常关闭');
      }
  	});
}).listen(9999);
server.on('close',function(){
    connection.end();
});