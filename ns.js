;(function(){

	module.exports=function(){
	  Date.prototype.ymd=function(){
	    var y=this.getFullYear().toString();
	    var m=(this.getMonth()+1).toString();
	    var d=this.getDate().toString();
	    return y+'-'+(m[1]?m:'0'+m[0])+'-'+(d[1]?d:'0'+d[0]);
	  };
		String.prototype.capitalize=function(){
	    return this.replace(/(?:^|\s)\S/g,function(a){return a.toUpperCase();});
	  };
	  var NameSpace={};
  	NameSpace.now=function(){return Math.round(new Date().getTime()/1000));
	  NameSpace.fInt=function(n,delimiter){return String(n).replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1'+(delimiter||','))};
	  NameSpace.fCurrency=function(n){n=+n;return '$'+n.toFixed(2)};
	  NameSpace.fPercent=function(n){return (Math.round(n*1000)/10)+'%'};
	  NameSpace.ucFirst=function(s){return s.substr(0,1).toUpperCase()+s.slice(1)};
	  NameSpace.uuid=function(){
	    var d=new Date().getTime();
	    var uuid='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
	      var r=(d+Math.random()*16)%16|0;
	      d=Math.floor(d/16);
	      return (c=='x'?r:(r&0x7|0x8)).toString(16);
	    });
	    return uuid;
		};
	  NameSpace.def=function(value,def){
	    return(typeof value!='undefined'&&value!==null)?value:def;
	  };
	  NameSpace.loadConfig=function(name,dir,cb){
			var fs=require('fs');
			//check for env vars
			var filePath=dir+'/'+name+'.json';
			fs.readFile(filePath,'utf8',function(err,data){
				if(err){
					cb(null);
			  	return;
				}
				try{
			  	var data=JSON.parse(data);
			  }catch(err){
					return cb(null);
			  }
		  	return cb(data);
			});
	  };
	  return NameSpace;
	}

}());
