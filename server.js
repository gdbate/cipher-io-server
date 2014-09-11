
	console.log('');

// G L O B A L S
	GLOBAL.CIO={};

	CIO.require=require('nowpaper-global/require');
	CIO.rdbSelect=require('./rdb-select');
	CIO.rdbMysql=require('./rdb-mysql');
	CIO.bcrypt=require('bcrypt');

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

// E X P R E S S
		request.get('/',function(req,res){
			res.send('Go Away');
		});

		//first time opening app
		//deviceId,devicePlatform,deviceVersion,deviceModel,nickname,password1,password2
		request.post('/user/init',function(req,res){
			//send back id,success
		});

		//get a list of groups
		//deviceId,nickname,password
		request.post('/user/init',CIO.auth.userCredentials,function(req,res){
			CIO.bcrypt.genSalt(10,function(err,salt){
		    CIO.bcrypt.hash("B4c0/\/", salt, function(err, hash) {
	        // Store hash in your password DB.
		    });
			});
			//send back [id,nickname,name,topic]
		});

		//creating a new group
		//deviceId,nickname,password|name,topic
		request.post('/group/init',CIO.auth.userCredentials,function(req,res){
			//send back id,admin,invite,post
		});

		//check invite hash, invite user (permission hashes do not leave device)
		//deviceId,nickname,password|permission(invite),user,group
		request.post('/group/invited',CIO.auth.userCredentials,CIO.auth.groupInvited,function(req,res){
			//send back success
		});

		//view the most recent posts in a group
		//deviceId,nickname,password|group
		request.post('/group/view',CIO.auth.userCredentials,CIO.auth.groupRead,function(req,res){
			//send back [{id,content,entered}]
		});

		//get new posts since the last one seen (for polling), also admin group updates
		//deviceId,nickname,password|group
		request.post('/group/view/since/:id',CIO.auth.userCredentials,CIO.auth.groupRead,function(req,res){
			//send back {posts:[{id,content,entered}]} or {posts:[],topic:''} or {deleted:true}
		});

		//post to the group
		//deviceId,nickname,password|permission,group,content
		request.post('/group/post',CIO.auth.userCredentials,CIO.auth.groupPost,function(req,res){
			//send back success
		});

		//change the group topic
		//deviceId,nickname,password|permission,group,topic
		request.post('/group/topic',CIO.auth.userCredentials,CIO.auth.groupAdmin,function(req,res){
			//send back success
		});

		//delete the group
		//deviceId,nickname,password|permission,group
		request.post('/group/delete',CIO.auth.userCredentials,CIO.auth.groupAdmin,function(req,res){
		});

	}

// M I D D L E W A R E
	CIO.auth={};

	CIO.auth.userCredentials=function(req,res,next){
		//verify record

		//password verification
		bcrypt.compare("B4c0/\/",hash,function(err,res){
	    if(res==true)return next();
    	else res.redirect('/');
		});
	}

	CIO.auth.groupRead=function(req,res,next){
		//verify user in group
		res.redirect('/');
	}

	CIO.auth.groupPost=function(req,res,next){
		//verify user in group and permission==group.post
		res.redirect('/');
	}

	//the invite permission isn't the most secure thing, but I think it is better to be able to invite people offline with NFC
	CIO.auth.groupInvited=function(req,res,next){
		//verify user in group and permission==group.invite
		res.redirect('/');
	}

	CIO.auth.groupAdmin=function(req,res,next){
		//verify user in group and permission==group.admin
		res.redirect('/');
	}
