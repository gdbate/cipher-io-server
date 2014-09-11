;(function(){

  module.exports=function(options){
    return{
      mysql:require('mysql'),
      client:null,
      options:options,
      mysqlRetry:(typeof options.retry=='number')?options.retry:5,
      retryAdd:0,
      mysqlTimer:null,
      queue:[],
      connected:false,
      connect:function(options){
        if(typeof options=='object')this.options=options;
        this.client=this.mysql.createConnection(this.options);
        var self=this;
        this.client.connect(function(err){
          if(err){
            console.log('- MySQL Connect error');
            clearTimeout(self.mysqlTimer);
            self.mysqlTimer=setTimeout(self.connect,(self.mysqlRetry+self.retryAdd)*1000);
            self.mysqlRetry+=self.retryAdd;
          }else{
            console.log('+ MySQL Connected');
            self.retryAdd=0;
            var cb=self.queue.shift();
            while(cb){
              cb(self.client,self.mysql);
              cb=self.queue.shift();
            }
            self.connected=true;
          }
        });
        this.client.on('end',function(){
          console.log('- MySQL Disconnected');
          self.connected=false;
          clearTimeout(self.mysqlTimer);
          self.mysqlTimer=setTimeout(self.mysql.connect,self.mysqlRetry*1000);
        });
        this.client.on('error',function(){
          console.log('- MySQL Error');
        });
      },
      require:function(cb){
        if(this.connected)
          cb(this.client,this.mysql);
        else
          this.queue.push(cb);
      },
      record:function(table,id,cb){
      	var self=this;
        if(typeof id=='string'||typeof id=='number'){
	        var query='SELECT * FROM '+this.mysql.escapeId(table)+' WHERE id = ?';
	        var values=[id];
	      }else if(typeof id=='object'){
	      	values=[];
	        var query='SELECT * FROM '+this.mysql.escapeId(table)+' WHERE';
	        _.each(id,function(value,name){
	        	values.push(value);
	        	query+=' '+self.mysql.escapeId(name)+' = ? AND'
	        });
	        query=query.substr(0,query.length-4);
	      }else{
	      	cb(false);
	      	return false;
	      }
        this.debug(query,values);
        this.require(function(con){
          con.query(query,values,function(err,results){
            if(err){
              console.log('- Query Error ['+err+']');
              cb(false);
            }else if(results.length!=1){
              cb(false);
            }else{
              var record=results.shift();
              cb(record);
            }
          });
        });
      },
      insert:function(table,record,cb,ignore){
        if(typeof table!='string'||typeof record!='object')return false;
        var query='INSERT'+(ignore?' IGNORE':'')+' INTO '+this.mysql.escapeId(table)+' SET ?';
        var values=[record];
        this.debug(query,values);
        this.require(function(con){
          con.query(query,values,function(err,results){
            if(err){
              console.log('- QUERY ERROR '+err);
              if(cb)cb(false,null);
            }else{
              if(cb)cb(true,(typeof results.insertId!='undefined')?results.insertId:null);
            }
          });
        });
      },
      insertUpdate:function(table,recordInsert,recordUpdate,cb){
        if(typeof table!='string'||typeof recordInsert!='object'||typeof recordUpdate!='object')return false;
        var query='INSERT INTO '+this.mysql.escapeId(table)+' SET ? ON DUPLICATE KEY UPDATE ?';
        var values=[recordInsert,recordUpdate];
        this.debug(query,values);
        this.require(function(con){
          con.query(query,values,function(err,results){
            if(err){
              console.log('- QUERY ERROR '+err);
              if(cb)cb(false,null);
            }else{
              if(cb)cb(true,results.insertId);
            }
          });
        });
      },
      update:function(table,id,record,cb){
      	if(typeof id=='string'&&id==+id)id=+id;
        if(typeof table!='string'||typeof id!='number'||typeof record!='object')return false;
        var query='UPDATE '+this.mysql.escapeId(table)+' SET ? WHERE `id` = ?';
        if(typeof record.id!='false')delete record.id;
        var values=[record,id];
        this.debug(query,values);
        this.require(function(con){
          con.query(query,values,function(err,results){
            if(err){
              console.log('- QUERY ERROR '+err);
              if(cb)cb(false);
            }else{
              if(cb)cb(true);
            }
          });
        });
      },
      debug:function(query,values){
      	values=_.map(values,function(value){
      		if(typeof value=='object')
      			return _.map(value,function(value,name){return name+'='+value});
      		return value;
      	}).join(',');
      	console.log('= '+query+' {'+values+'}');
      }
    };
  }

}());