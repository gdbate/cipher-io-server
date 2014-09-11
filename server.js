
	console.log('');

// G L O B A L S
	GLOBAL.CIO={};

	CIO.require=require('nowpaper-global/require');
	CIO.rdbSelect=require('./rdb-select');
	CIO.rdbMysql=require('./rdb-mysql');

// L O A D - S E T T I N G S
	CIO.loadConfig('config',__dirname,function(data){
		if(!data){
			console.log('- Error Reading Settings');
		}else{
			CIO.settings=data;
			CIO.mysql=require('./mysql')(CIO.settings.mysql);
			CIO.mysql.connect();
			CIO.business();
		}
	})

// D E P E N D A N C I E S
	var express=require('express')
	var logger=require('morgan');
	var bodyParser=require('body-parser');
	var methodOverride=require('method-override');

	var request=express();
	request.use(bodyParser());
	request.use(cookieParser());
	request.use(express.static(__dirname+'/static'));

	CIO.business=function(){

// W E B   S E R V E R
		request.post('/',function(req,res){
		});

		//first time opening app
		request.post('/user/init',function(req,res){
		});

		//get a list of groups
		request.post('/user/init',function(req,res){
		});

		//creating a new group
		request.post('/group/init',function(req,res){
		});

		//invited to a new group (Makes more sense to come from user who received invite due to NFC one-way data exchange)
		request.post('/group/invited',function(req,res){
		});

		//view the most recent posts in a group
		request.post('/group/view',function(req,res){
		});

		//get new posts since the last one seen (for polling)
		request.post('/group/view/since/:id',function(req,res){
			//req.params.id
		});

		//post to the group
		request.post('/group/post',function(req,res){
		});

		//change the group topic
		request.post('/group/topic',function(req,res){
		});

	}
